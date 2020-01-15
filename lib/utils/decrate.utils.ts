import { ComponentBean } from "../component";

export function getParamsName(bean: ComponentBean, name: string) {
   
   return bean.target.name + "__" + (bean.value as any).name + "__" + name;
}

export function getPropertyName(bean: ComponentBean, name: string) {
    return bean.target.name + "__property__" + name;
}