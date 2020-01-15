import { ComponentBean, ComponentType, ComponentStore } from "../component";


export function Component(name?:string) {
    const component:ComponentBean = new ComponentBean();
    component.type = ComponentType.NORMAL;
    component.runtime = false;
    component.options = {};
    return function(target) {
      component.name = name || target.name;
      component.target = target;
      component.value = target;
      ComponentStore.getInstance().add(component.name, component);
    }
}