import { isObject } from "@vue/shared";
import { track, trigger } from "./reactiveEffect";
import { reactive } from "./reactivity";
import { ReactiveFlags } from "./constans";

export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true; // 返回true表示是响应式对象
    }
    // 当取值的时候，应该让响应式属性和effect关联起来
    track(target, key); // 追踪依赖
    
    let res = Reflect.get(target, key, receiver);
    if (isObject(res)) { // 如果取到的值是对象，应该返回响应式对象
      return reactive(res);
    }
    return res; // 使用Reflect来获取属性值
  },
  set(target, key, value, receiver) {
    // 找到属性，让对应的effect重新执行
    let oldValue = target[key]; // 获取旧值
    let result = Reflect.set(target, key, value, receiver)
    if (oldValue !== value) {
      trigger(target, key, value, oldValue); // 触发依赖
    }
    return result; // 使用Reflect来设置属性值
  },
} 
