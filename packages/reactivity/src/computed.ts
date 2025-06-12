import { isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";

class CompoutedImpl {
  public _value
  public effect
  public dep
  constructor(getter, public setter) {
    // 需要创建一个effect来管理当前计算属性的dirty
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      () => {
        // 当依赖的值变化时，应该触发渲染effect重新执行
        triggerRefValue(this);
      }
    )
  }

  get value() {
    // 这里需要根据dirty做处理
    if (this.effect.dirty) {
      this._value = this.effect.run(); // 执行effect，获取最新的值，缓存到_value中
      // 如果在effect中使用了计算属性，计算属性需要收集这个effect
      trackRefValue(this);
    }
    return this._value;
  }

  set value(newValue) {
    // this.effect.dirty = false; // 设置dirty为true，表示需要重新计算
    this.setter(newValue)
  }
}

export function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions)
  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }


  return new CompoutedImpl(getter, setter); // 计算属性ref
}