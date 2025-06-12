export default function patchStyle(el, prevValue, nextValue) {
  let style = el.style
  for (const key in nextValue) {
    style[key] = nextValue[key] // 新样式全部生效
  }

  if (prevValue) {
    for (const key in prevValue) { 
      if (nextValue[key] == null) { // 看以前的属性现在有没有，如果没有用到就删除
        style[key] = null
      }
    }
  }
}