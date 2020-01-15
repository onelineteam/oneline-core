import 'reflect-metadata';
import { ComponentBean, ComponentType, ComponentPropertyOptions, ComponentStore, ComponentColumnOptions } from "../component";

export function Property(name?:string) {
   const component: ComponentBean = new ComponentBean();
   component.runtime = true;
   component.type = ComponentType.PROPERTY;
   return function(target:Object, propKey: string) {
      log.debug("property-->", Reflect.getMetadata('design:type', target, propKey).prototype);
      component.target = target.constructor;
      component.name = target.constructor.name + "__property__" + propKey;
      component.value = propKey;
      component.options = <ComponentPropertyOptions> {
         type:  Reflect.getMetadata('design:type', target, propKey),
         name: propKey
      }

      ComponentStore.getInstance().add(component.name, component);
   }
}

export function Column(options: Object) {
  
   return function(target:Object, propKey: string) {
      log.debug("property-->", Reflect.getMetadata('design:type', target, propKey).prototype);
      let component: ComponentBean = ComponentStore.getInstance().getColumn(target.constructor);
      if(component === null) {
         component = new ComponentBean();
         component.runtime = true; 
         component.value = target;
         component.name = target.constructor.name + "__column";
         component.type = ComponentType.COLUMN;
         component.target = target.constructor;
         component.options = <ComponentColumnOptions> { 
            rules: {
               [propKey]: options
            } 
         }
      } else {
        const column:ComponentColumnOptions =  component.options as ComponentColumnOptions;
        column.rules[propKey] = options;
      }
      
    
      

      ComponentStore.getInstance().add(component.name, component);
   }
}