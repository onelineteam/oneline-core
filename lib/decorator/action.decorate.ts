import {getFuncParamsName} from '../utils'
import { ComponentOptions, ComponentBean, ComponentType, ComponentStore, ComponentActionOptions } from "../component";
type METHODTYPE = 'GET'|'POST'|'DELETE'|'OPTIONS'|'PUT'|'PATCH'
export function Action(options: ComponentActionOptions) {
   const component:ComponentBean = new ComponentBean(); 
   component.options = options;
   component.type = ComponentType.VIEW;
   component.runtime = false;

   //这里要区分类和函数
   return function(target: Function | Object, ...args) {
       
       if(target instanceof Function) { //构造函数
         component.name = options.name || target.name;
         component.target = target;
         component.value = target; 
         options.paramtypes =   Reflect.getMetadata('design:paramtypes', target) || [];
        
       } else { //函数
         component.name = options.name || `${target.constructor.name}__${args[0]}__${options.method}`;
         component.target = target.constructor;
         component.value = target[args[0]];
         options.paramtypes =   Reflect.getMetadata('design:paramtypes', target, args[0]);
        }
        options.paramNames = getFuncParamsName(component.value); 

        options.params = {};
        options.paramNames.forEach((name,index) => {
          options.params[name] = options.paramtypes[index];
        })

       log.debug("参数列表: ",  options.params);
       
       ComponentStore.getInstance().add(component.name, component);
   }
}

function SingleAction(path: string | ComponentActionOptions, actionName?: string, marker:boolean = false, method: METHODTYPE = 'GET') {
  let options: ComponentActionOptions = null;
  if(typeof path === 'string') {
     options = {
        path, 
        method,
        paramtypes: [],
        actionName: actionName || "",
        marker: marker
     }
  } else {
      options = <ComponentActionOptions>path;
      options.actionName = actionName || "";
      options.marker = marker;
  }

  return Action(options);
}

export function Get(path: string | ComponentActionOptions, actionName?: string, marker:boolean = false) {
    return SingleAction(path, actionName, marker);
}

export function Post(path: string | ComponentActionOptions, actionName?: string,  marker:boolean = false) {
  return SingleAction(path, actionName, marker, 'POST');
}

export function Delete(path: string | ComponentActionOptions, actionName?: string, marker:boolean = false) {
    return SingleAction(path, actionName, marker, 'DELETE');
}

export function Options(path: string | ComponentActionOptions, actionName?: string, marker:boolean = false) {
    return SingleAction(path, actionName, marker, 'OPTIONS');
}

export function Put(path: string | ComponentActionOptions, actionName?: string, marker:boolean = false) {
  return SingleAction(path, actionName, marker, 'PUT');
}


export function Patch(path: string | ComponentActionOptions, actionName?: string, marker:boolean = false) {
  return SingleAction(path, actionName, marker, 'PATCH');
}








