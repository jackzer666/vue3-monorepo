import { activeEffect, trackEffects, triggerEffects } from "./effect";

const targetMap = new WeakMap();

export function createDep(cleanup, key) {
  let dep = new Map() as any;
  dep.cleanup = cleanup; // 添加清理函数
  dep.name = key;
  return dep;
}

export function track(target, key) {
  // 如果有activeEffect，说明当前属性key在effect中被使用了；没有说明不是在effect中使用
  if (activeEffect) {

    // 找对象对应的map是否存在
    let depsMap = targetMap.get(target);

    if (!depsMap) {
      // 新增
      targetMap.set(target, (depsMap = new Map()));
    }

    // 找找有没有收集器
    let dep = depsMap.get(key);

    if (!dep) {
      // 新增收集器
      depsMap.set(
        key, 
        dep = createDep(() => depsMap.delete(key), key)  // 这里不用map是因为需要新增cleanup函数
      );
    }

    // 将当前的effect添加到dep收集器中，后续可以根据值的变化触发dep中存放的effect
    trackEffects(activeEffect, dep);
  }
}

// {name, age}: {
//   name: {effect},
//   age: {effect}
// }

export function trigger(target, key, value, oldValue) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return; // 找不到这个对象，不需要更新页面，直接返回
  }
  const dep = depsMap.get(key);
  if (dep) {
    // 修改的属性对应的effect存在
    triggerEffects(dep);
  }
}