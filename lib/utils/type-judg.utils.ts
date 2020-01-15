export function isArray(data:any) {
  return data.constructor instanceof Array;
}

export function isNumber(data: any) {
  return typeof data == "number";
}

export function isString(data: any) {
  return typeof data == "string";
}

export function isFunction(data: any) {
  return data instanceof Function && !(/class +.*/.test(data.constructor.toString()));
}

export function isClass(data: any) {
  return /class +.*/.test(data.constructor);
}

export function isDate(data: any) {

}