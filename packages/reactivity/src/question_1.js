// 为什么proxy需要搭配Reflect使用

const obj = {
  originName: 'test',
  get name() {
    return this.originName + '123'
  }
}

// console.log(obj.name)

const proxy = new Proxy(obj, {
  get(target, key, receiver) {
    console.log('get')
    // return target[key]
    return Reflect.get(target, key, receiver)
  }
})

console.log(proxy.name)

// 获取proxy.name时，target是obj，key是name，获取name时，this是原先的obj，
// 因此获取this.originName不会走到proxy的get中，而是直接访问了obj的originName属性
// 考虑场景，如果obj是一个vue中的对象，对象更新数据需要更新视图
// 通过proxy的get收集了依赖，即哪些key的更新会触发页面更新
// 如果直接是使用target[key]，name收集了但originName没有被收集，因为target[key]中的name中的this指向的是obj，而不是proxy，没有出发proxy的get originName
// 如果使用了Reflect.get(target, key, receiver)，则this会指向receiver即代理对象proxy,从而再次出发proxy的get方法，收集了originName的依赖
// 这样就可以确保所有相关的依赖都被收集到，确保数据更新时视图能够正确更新