import { isObject } from "@vue/shared";
import {  mutableHandlers } from "./baseHandler";
import { ReactiveFlags } from "./constans";

// 用于记录代理后的结果，可以复用。根据对象缓存
const reactiveMap = new WeakMap();

// 创建代理对象的通用函数
function createReactiveObject(target) {
  // 统一做判断响应式对象必须是对象
  if (!isObject(target)) {
    return target
  }
  // 如果是响应式对象，直接返回。保证代理对象无法再次被代理
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target; // 如果已经是响应式对象，直接返回
  }
  // 如果已经代理过了，直接返回。保证同一个对象的代理对象相同
  const existsProxy = reactiveMap.get(target);
  if (existsProxy) {
    return existsProxy;
  }
  // mutableHandlers是get set抽离
  let proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}


export function reactive(target) {
  return createReactiveObject(target);
}

export function shallowReactive(target) {
  return createReactiveObject(target);
}

export function toReactive(value) {
  if (isObject(value)) {
    return reactive(value);
  }
  return value;
}

export function isReactive(value) {
  return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}