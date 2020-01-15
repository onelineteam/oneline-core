import { getParamsName } from "./utils/decrate.utils";
import { HttpResponseHeader } from ".";

export enum ComponentType {
  NORMAL, VIEW, SERVICE, DAO, PARAM, PROPERTY, COLUMN
}

export type PARAMTYPE = 'NORMAL' | 'BODY' | 'FILE';

export class ComponentOptions {
  name?: string; //名称
}

export class ComponentActionOptions extends ComponentOptions {
  path: string; //View中的请求路径
  method: any; // 请求方法
  paramtypes?: Array<any>; //参数类型数据
  paramNames?: Array<string>;//参数名称
  params?: object;
  actionName?: string;
  marker?:boolean;
  response?: HttpResponseHeader;
}

export class ComponentPropertyOptions extends ComponentOptions {
  type: Function; //属性类型
}

export class ComponentParamOptions extends ComponentOptions {
  type: Function; //参数类型
  method: Function; //参数所在方法
  methodName: string; //参数所在方法名称
  index: number;//参数在方法的位置
  aliasName: string;// 别名
  mode: PARAMTYPE;
  query?: any; //比如body还可以加入query中的参数
  rule?: any; //验证
}

export class ComponentColumnOptions extends ComponentOptions {
  // type: Function; //参数类型
  rules: Object;
}

export class ComponentBean {
  name: string; // 名称
  type: ComponentType; //注解类型
  value: Object; //值
  target: Function; //所在的类
  runtime: Boolean; //是否是运行时,
  options: ComponentOptions
}

export class ComponentStore {
  private components: Map<string, ComponentBean>;
  private static store = new ComponentStore();

  private constructor() {
    this.components = new Map();
  }

  public static getInstance(): ComponentStore {
    return ComponentStore.store;
  }

  add(key: string, value: ComponentBean) {
    if (this.has(key)) {
      throw new Error('出现重复的注解组件');
    }
    // log.debug("this is test", this.components.size)
    this.components.set(key, value);
  }

  get(key: string): ComponentBean {
    return this.components.get(key);
  }

  has(key: string): Boolean {
    log.debug(key, 'helloworld', this.components.size)
    return key in this.components;
  }

  getComponents() {
    return this.components;
  }

   

  getActions(): Map<String, ComponentBean> {
    const actions = new Map<String, ComponentBean>();
    for (let [key, value] of this.components) {
      if (value.type === ComponentType.VIEW) {
        actions.set(key, value);
      }
    }

    return actions;
  }

  getComponent(name: string): ComponentBean {
    return this.get(name);
  }

  /**
   * 通过函数来找到params
   * @param target 函数
   */
  getComponentsByFuncton(target: Function): Map<String, ComponentBean> {
    const params = new Map<String, ComponentBean>();
    for (let [key, value] of this.components) {
      const options: ComponentParamOptions = value.options as ComponentParamOptions;
      if (value.type === ComponentType.PARAM && options.method === target) {
        params.set(key, value);
      }
    }

    return params;
  }


  getParamName(component: ComponentBean, realParamName: string): string {
    const name = getParamsName(component, realParamName);

    for (let [key, value] of this.components) {
      const options: ComponentParamOptions = value.options as ComponentParamOptions;
      if (value.type === ComponentType.PARAM && key === name) {
        return (<ComponentParamOptions>value.options).aliasName;
      }
    }
    return null;
  }

  getParamBody(component: ComponentBean, realParamName: string): ComponentBean {

    const name = getParamsName(component, realParamName);

    for (let [key, value] of this.components) {
      const options: ComponentParamOptions = value.options as ComponentParamOptions;

      // log.debug(value.type, key, name, options.mode)

      if (value.type === ComponentType.PARAM && key === name && options.mode === 'BODY') {
        return value;
      }
    }
    return null;

  }


  getProperty(target: Function): ComponentBean[] {
    const beans: ComponentBean[] = [];

    for (let [key, value] of this.components) {

      if (value.type === ComponentType.PROPERTY && target === value.target) {
        beans.push(value);
      }
    }

    return beans;
  }


  getColumn(target: Function): ComponentBean {
    for (let [key, value] of this.components) {

      if (value.type === ComponentType.COLUMN && target === value.target) {
        return value;
      }
    }
    return null;
  }




}