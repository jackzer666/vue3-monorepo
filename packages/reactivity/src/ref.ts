import { activeEffect, trackEffects, triggerEffects } from "./effect";
import { createDep } from "./reactiveEffect";
import { toReactive } from "./reactivity";





export function ref(value) {
  return createRef(value);
}


function createRef(value) {
  return new RefImpl(value);
}

class RefImpl {
  public __is_ref = true; // 标记为ref类型
  public _value; // 存储值
  public dep // 用于收集对应的effect

  constructor(public rawValue) {
    this._value = toReactive(rawValue); // 将原始值转换为响应式对象
  }

  get value() {
    trackRefValue(this);
    return this._value
  }
  set value(newValue) {
    if (this.rawValue !== newValue) {
      this.rawValue = newValue; // 更新原始值
      this._value = newValue; // 更新值
      triggerRefValue(this);
    }
  }
}

export function trackRefValue(ref) {
  if (activeEffect) {
    trackEffects(activeEffect, (ref.dep = ref.dep || createDep(() => (ref.dep = undefined), "undefined")));
  }
}
export function triggerRefValue(ref) {
  let dep = ref.dep;
  if (dep) {
    triggerEffects(dep);
  }
}

class ObjectRefImpl {
  public __v_isRef = true; // 标记为ref类型
  public dep // 用于收集对应的effect

  constructor(public _object, public _key) {}

  get value() {
    // trackRefValue(this);
    return this._object[this._key];
  }
  set value(newValue) {
    this._object[this._key] = newValue;

    // if (this._object[this._key] !== newValue) {
    //   // triggerRefValue(this);
    // }
  }
}

export function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}
export function toRefs(object) {
  const ret = {};
  for (const key in object) {
    ret[key] = toRef(object, key);
  }
  return ret;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      const val = Reflect.get(target, key, receiver);
      // 如果是ref类型，直接返回value
      return val && val.__v_isRef ? val.value : val; // 自动脱ref
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      if (oldValue && oldValue.__v_isRef) {
        // 如果是ref类型，直接设置value
        oldValue.value = value;
      } else {
        // 否则直接设置值
        Reflect.set(target, key, value, receiver);
      }
      return true; // 返回true表示设置成功
    }
  });
}

export function isRef(value) {
  return !!(value && value.__is_ref);
}