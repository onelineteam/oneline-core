
export  class ObjectCreator {
    static create (constructor:any):Object{ 
       const instance = new constructor();
    //    instance['__proto__'] = Reflect.getPrototypeOf(constructor);
    //    instance.__proto__.constructor = constructor;
       const proto = Object.getPrototypeOf(constructor) 
       
       return instance;
    }
}