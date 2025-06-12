function createInvoker(value) {
  const invoker = (e) => invoker.value(e)
  invoker.value = value // 修改invoker中的value属性，可以修改对应的调用函数
  return invoker
}


export default function patchEvent(el, name, nextValue) {
  // vue_event_invoker 为当前元素创建缓冲区，缓冲当前元素绑定过哪些事件
  const invokers = el._vei || (el._vei = {})
  const eventName = name.slice(2).toLowerCase()
  const existingInvoker = invokers[name] // 是否存在同名的事件绑定

  // 如果存在同名的事件绑定，且nextValue不为null
  if (nextValue && existingInvoker) {
    // 事件换绑
    return (existingInvoker.value = nextValue) 
  }

  if (nextValue) {
    // 创建一个调用函数，内部会执行nextValue，并且把这个函数缓存到invokers中
    const invoker = (invokers[name] = createInvoker(nextValue))
    return el.addEventListener(eventName, invoker)
  }
  
  if (existingInvoker) {
    // 以前有事件，现在没有了
    el.removeEventListener(eventName, existingInvoker)
    invokers[name] = undefined
  }
}