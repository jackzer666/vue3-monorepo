import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactivity";
import { isRef } from "./ref";

export function watch(source, cb, options = {}) {
  return doWatch(source, cb, options as any);
}

export function watchEffect(source, options = {}) {
  return doWatch(source, null, options as any);
}

function traverse(source, depth, currentDepth = 0, seen = new Set()) {
  if (!isObject(source)) {
    return source;
  }
  if (depth) {
    if (currentDepth >= depth) {
      return source;
    }
    currentDepth++; // 根据deep属性来看是否 深度
  }
  if (seen.has(source)) {
    return source; // 如果已经遍历过了，直接返回，避免循环引用
  }
  seen.add(source);
  for (const key in source) {
    traverse(source[key], depth, currentDepth, seen);
  }
  return source; // 返回遍历后的对象，遍历就会触发getter
}

function doWatch(source, cb, { deep, immediate }) {
  const reactiveGetter = (source) =>
    traverse(source, deep === false ? 1 : undefined);

  let getter;
  // 必须监控某个代理对象
  if (isReactive(source)) {
    // 创建一个可以给ReactiveEffect使用的getter函数，需要对这个对象进行取值操作，会关联当前的ReactiveEffect
    getter = () => reactiveGetter(source);
  } else if (isRef(source)) {
    getter = () => source.value;
  } else if (isFunction(source)) {
    getter = source;
  }

  let oldValue;

  let clean
  const onCleanup = (fn) => {
    clean = () => {
      fn();
      clean = undefined;
    }
  }


  const job = () => {
    if (cb) {
      const newValue = effect.run();

      if (clean) {
        clean(); // 在执行回调前，先调用上一次的清理函数清理
      }

      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    } else {
      // watchEffect
      effect.run();
    }
  };

  const effect = new ReactiveEffect(getter, job);

  if (cb) {
    if (immediate) {
      // 立即先执行一次用户的回调，传递新值和老值
      job();
    } else {
      oldValue = effect.run(); // 执行一次，获取初始值
    }
  } else {
    // watchEffect 直接执行即可
    effect.run();
  }

  const unwatch = () => {
    effect.stop(); // 停止effect的收集
  }

  return unwatch;
}
