// 主要对节点的增删改查
export const nodeOps = {
  // 如果第三个参数为 null，等价appendChild
  insert: (el, parent, anchor = null)  =>{
    parent.insertBefore(el, anchor || null);
  },
  // 移除dom元素
  remove(el) {
    const parent = el.parentNode;
    if (parent) {
      parent.removeChild(el);
    }
  },
  createElement: type => document.createElement(type),
  createText: text => document.createTextNode(text),
  // 设置文本，给文本节点设置文本
  setText: (node, text) => node.nodeValue = text,
  // 给元素设置文本内容
  setElementText: (el, text) => el.textContent = text,
  parentNode: el => el.parentNode,
  nextSibling: el => el.nextSibling,
}