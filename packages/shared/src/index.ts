export function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isFunction(value: any): value is Function {
  return typeof value === 'function';
}