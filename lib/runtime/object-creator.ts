import { ComponentStore } from "../component";

export  class ObjectCreator {
    static create (constructor:any):Object{ 
       const instance = new constructor();
    //    instance['__proto__'] = Reflect.getPrototypeOf(constructor);
    //    instance.__proto__.constructor = constructor;
       const proto = Object.getPrototypeOf(constructor)
        
      //  log.debug(instance.findList)
        
       
       return instance;
    }
}