import { DirtyLevels } from "./constans";

export function effect(fn, options?) {
  // 创建一个响应式effect，数据变化后可以重新执行

  // 创建一个effect，只要fn依赖的属性变化了就要执行回调
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run()
  });
  // 开始时执行一次
  _effect.run()

  if (options) {
    Object.assign(_effect, options); // 将options中的属性合并到_effect中
  }

  const runner = _effect.run.bind(_effect); // 绑定this到_effect
  runner.effect = _effect; // 将_effect挂载到runner上，方便后续使用
  return runner; // 返回一个可以执行的函数
}
export let activeEffect


function preCleanEffect(effect) {
  effect._depsLength = 0;
  effect._trackId++; // 每次执行前，trackId自增，避免重复收集。如果同一个effect执行，id就是相同的
}


export class ReactiveEffect {
  // 用于记录当前effect执行了几次
  _trackId = 0
  deps = []; // 用于存储依赖的收集器
  _depsLength = 0 
  _running = 0
  _dirtyLevel = DirtyLevels.Dirty

  // 创建的effect默认是响应式的
  public active = true;

  // fn 用户编写的函数
  // 如果fn中的依赖数据变化了，就会重新执行run
  constructor(public fn, public scheduler) {
    // this.fn = fn;
    // this.scheduler = scheduler;
  }

  public get dirty() {
    return this._dirtyLevel === DirtyLevels.Dirty;
  }

  public set dirty(value) {
    this._dirtyLevel = value ? DirtyLevels.Dirty : DirtyLevels.NoDirty;
  }

  // 执行fn
  run() {
    // 每次运行后effect变为noDirty
    this._dirtyLevel = DirtyLevels.NoDirty;
    if (!this.active) {
      return this.fn();
    } else {
      let lastEffect = activeEffect;
      try {
        activeEffect = this; // 设置当前effect为activeEffect
        // 每次执行前，清空上一次依赖
        preCleanEffect(this)
        this._running++; // 记录当前执行次数，避免递归调用时死循环
        return this.fn(); // 执行用户编写的函数
      } finally {
        postCleanEffect(this); // 清除多余的依赖
        activeEffect = lastEffect; // 执行完毕后清除activeEffect
        this._running--; // 执行次数减一
      }
    }
  }

  stop () {
    if (this.active) {
      this.active = false;
      preCleanEffect(this);
      postCleanEffect(this); 
    }
  }
}

function cleanDepEffect(dep, effect) {
  // 清除上一次的依赖
  dep.delete(effect);
  if (dep.size === 0) {
    // 如果dep中没有任何effect了，就清除这个dep
    dep.cleanup(); // 执行dep的清理函数
  }
}

function postCleanEffect(effect) {
  if (effect.deps.length > effect._depsLength) {
    // 如果deps中有多余的依赖，说明上一次的依赖没有被清除
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanDepEffect(effect.deps[i], effect); // 清除多余的依赖
    }
    effect.deps.length = effect._depsLength; // 重置deps的长度
  }
}

export function trackEffects(effect, dep) {
  // 如果当前的effect已经被收集过了，就不需要再收集了。优化同一个effect多次执行的情况
  if (dep.get(effect) !== effect._trackId) {
    // 将当前的effect添加到dep收集器中
    dep.set(effect, effect._trackId);

    let oldDep = effect.deps[effect._depsLength];
    if (oldDep !== dep) {
      if (oldDep) {
        cleanDepEffect(oldDep, effect); // 清除上一次的依赖
      }
      effect.deps[effect._depsLength++] = dep; // 将dep添加到deps中

    } else {
      effect._depsLength++
    }
  }

  
  // 期望可以知道effect中有哪些dep被收集了(双向记忆)
  effect.deps[effect._depsLength++] = dep;

}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) { // 找到每一个effect

    
    if (effect._dirtyLevel < DirtyLevels.Dirty) {
      effect._dirtyLevel = DirtyLevels.Dirty; // 设置为dirty，表示需要重新执行
    }

    if (!effect._running) {
      if (effect.scheduler) {
        // 如果有scheduler，说明需要手动控制执行
        effect.scheduler();
      }
    }
  }
}