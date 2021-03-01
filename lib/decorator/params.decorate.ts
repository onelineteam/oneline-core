import { ComponentBean, ComponentType, ComponentParamOptions, ComponentStore, PARAMTYPE } from "../component";
import { getFuncParamsName } from "../utils";
 


export function Param(options?:string|any, mode: PARAMTYPE = 'NORMAL'):Function {
   
  const component: ComponentBean = new ComponentBean();
  
  component.type = ComponentType.PARAM;
  
  component.runtime = true;

   return function(target: Object, methodName: string, index:number) {
       let name = getFuncParamsName(target[methodName])[index]; 
       //类名称__方法名__参数名称
       component.name = target.constructor.name + "__" + methodName + "__" + name;
       component.target = target.constructor;
       component.value = Reflect.getMetadata("design:paramtypes", target, methodName)[index];
       component.options = <ComponentParamOptions> {
           name: name,
           aliasName: (options||""),
           index: index,
           methodName: methodName,
           method: target[methodName],
           type: component.value,
           mode: mode,
           extra: {} 
       }
       if(typeof options === "object") {
         (<ComponentParamOptions>component.options).rule = options.rule;
         (<ComponentParamOptions>component.options).query = options.query;
         (<ComponentParamOptions>component.options).aliasName = options.aliasName || "";
         (<ComponentParamOptions>component.options).extra = options.extra || {};
       }
    //    log.debug('params --> ', Reflect.getMetadata("design:paramtypes", target, methodName)[index])

       ComponentStore.getInstance().add(component.name, component);
   }
}



export function Body(options?:any):Function {
  return Param(options, 'BODY')
}

export function File() {
  return Param(undefined, 'FILE')
}
 