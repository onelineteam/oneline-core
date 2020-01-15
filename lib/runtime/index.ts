import * as http from "http";
import * as fastify from "fastify";
import { FastifyRequest, FastifyReply } from "fastify";
import { ComponentStore, ComponentBean, ComponentActionOptions, ComponentParamOptions, ComponentPropertyOptions, ComponentColumnOptions } from "../component";
import { HttpRequest, HttpResponse } from "../http/in-out.http";
import { ObjectCreator } from "./object-creator";
import MongodbSession from "../db/mongodb";
import { HttpResult, HttpFilter } from "../http";
import { MongoError, ObjectID } from "mongodb";

export const app: fastify.FastifyInstance<http.Server, http.IncomingMessage, http.ServerResponse> = fastify();
export let filters = [];

export function initDb(options) {
  MongodbSession.database = options.database;
  MongodbSession.host = options.host;
  MongodbSession.port = options.port;
  MongodbSession.username = options.username;
  MongodbSession.password = options.password;
}

export function init() {
  const store: ComponentStore = ComponentStore.getInstance();
  const actions: Map<String, ComponentBean> = store.getActions();

  for (let [key, value] of actions) {
    const options: ComponentActionOptions = value.options as ComponentActionOptions;

    if (options.path) {
      let path = "";
      if (value.target === value.value) {
        path = options.path;
      } else {
        const parent: ComponentBean = store.get(value.target.name);
        path = parent ? (<ComponentActionOptions>parent.options).path : "";
        path = path + options.path;
      }

      app.route({
        method: options.method,
        url: path,
        async handler(request: FastifyRequest<http.IncomingMessage>, response: FastifyReply<http.ServerResponse>) {
          let filterResult = true;
          for (let i = 0; i < filters.length; i++) {
            const element = filters[i];
            const filter: HttpFilter = ObjectCreator.create(element) as HttpFilter;
            const session: MongodbSession[] = [];
            await handlerProperty.call(filter, filter.constructor, session);

            const result = await filter.chain(app, request, response, key, value);
            closeSessionQuick(session);
            if (!result.success) {
              filterResult = result.success;
              response.send(result);
              break;
            }

            if (result.success && result.break) {
              break;
            }
          }

          filterResult && (await handler.call(value, request, response));
        }
      });
    }
  }
}

async function handler(request: FastifyRequest<http.IncomingMessage>, response: FastifyReply<http.ServerResponse>) {
  const origin = this.value as Function;
  const options: ComponentActionOptions = this.options;
  const values = [];
  const paramNames = options.paramNames;
  for (let index: number = 0; index < paramNames.length; index++) {
    const name = paramNames[index];
    const typeName = options.paramtypes[index];


    if (typeName === String || typeName === Number || typeName === Object || typeName === Array) {
      let aliasName: string = ComponentStore.getInstance().getParamName(this, name);
      handlerString.call(values, request, aliasName || name, index);
    } else if (typeName === HttpRequest) {
      handlerHttpRequest.call(values, request, name, index);
    } else if (typeName === HttpResponse) {
      handlerHttpResponse.call(values, response, name, index);
    } else {
      const comp: ComponentBean = ComponentStore.getInstance().getParamBody(this, name);
      if (comp !== null) {
        handlerBody.call(values, request, comp, index);


        const options = comp.options as ComponentParamOptions;
        //验证对象的规则
        const value: Object = values[index];


        const issuccess: number = await validateObject(value, response, options ? options.rule : undefined);
        if (issuccess == -1) return;


      }
    }
  }

  //创建对象, 调用方法(目前是一个方法的调用, 都需要创建一个对象, 以后可以考虑单例)
  const bean = ObjectCreator.create(this.target);

  //处理注入属性
  await handlerProperty.call(bean, this.target);
  try {
    // const result:any = await this.value.call(bean, ...values); //es5, 没有函数名称
    const result: any = await bean[origin.name](...values);
    // const result = await origin(...values);
    // log.debug("返回的信息: ", result)
    if (result) {
      response.send(result);
    } else {
      log.debug("没有返回信息.......");
    }
  } catch (error) {

    let code = 2500;
    if (error instanceof MongoError) {
      code = 2900;
    }
    //有数据库
    response.send(
      HttpResult.toFail({
        message: error.toString(),
        code: code
      })
    );
  }

  closeSession(bean);
}

/**
 * 这个函数有待优化, 关闭session
 * @param bean
 * @param level
 */
export function closeSession(bean: Object, level: number = 0) {
  if (level > 5) return;
  const names: string[] = Object.getOwnPropertyNames(bean);
  // log.debug('close session:', Object.getPrototypeOf(bean))
  if (names.length === 0) return;
  names.forEach(name => {
    if (typeof bean[name] === "object" && bean[name] !== null && bean[name].constructor) {
      const coname = bean[name].constructor.name;
      // log.debug('name: ', name, coname);
      if (coname === "MongodbSession") {
        (<MongodbSession>bean[name]).close();
      }
      closeSession(bean[name], level + 1);
    }
  });
}

export function closeSessionQuick(session: MongodbSession[]) {
  session.forEach(item => item.close());
}

export async function handlerProperty(bean: Function, session: MongodbSession[] = []) {
  const properties: ComponentBean[] = ComponentStore.getInstance().getProperty(bean);
  for (let i = 0; i < properties.length; i++) {
    const item = properties[i];
    const options = item.options as ComponentPropertyOptions;
    // log.debug("处理属性:--->", options.type)
    //必须对Mongo做一个处理
    if (options.type.name === "MongodbSession") {
      if (session.length > 0) {
        this[options.name] = session[0];
      } else {
        this[options.name] = ObjectCreator.create(options.type);
        await this[options.name].open();
        session.push(this[options.name]);
      }
    } else {
      this[options.name] = ObjectCreator.create(options.type);
    }
    // log.debug("property length: ", this[options.name], options.type.name)
    await handlerProperty.call(this[options.name], options.type, session); //递归的处理注入对象
  }
}

function handlerBody(request: FastifyRequest<http.IncomingMessage>, bean: ComponentBean, index: number) {
  const options = bean.options as ComponentParamOptions;
  const constructor = options.type;

  const body = ObjectCreator.create(constructor) || {};
  const bodyValue = { ...request.body };
  if (options.query) {
    const query = options.query;
    Object.keys(query).forEach(key => {

      const keys: any = query[key];

      if (Array.isArray(keys)) {
        keys.forEach(k => {
          bodyValue[k] = request.query[key] || request.params[key];
        })
      } else {
        bodyValue[query[key]] = request.query[key] || request.params[key];
      }
    });
  }
  //目前是以json格式传递, 以后需要做form表单的格式
  handlerBodyKey(body, bodyValue);
  function handlerBodyKey(object: Object, value: Object) {
    Object.keys(value).forEach(key => {
      if (key in object) {
        object[key] = value[key];
      }
    });
  }


  this[index] = body;
}

function handlerString(request: FastifyRequest<http.IncomingMessage>, name: string, index: number) {


  const params = { ...request.params, ...request.query, ...request.body };

  if (name in params) {
    this[index] = params[name];
    if (/^\d+$/.test(params[name])) {
      this[index] = parseInt(params[name]);
    }
  }
}

function handlerHttpRequest(request: FastifyRequest<http.IncomingMessage>, name: string, index: number) {
  this[index] = new HttpRequest(request);
}

function handlerHttpResponse(response: FastifyReply<http.ServerResponse>, name: string, index: number) {
  this[index] = new HttpResponse(response);
}

//处理参数
// 1. 请求对象, 响应对象
// 2. 请求参数
// 3. 请求体

export async function validateObject(value: Object, response: FastifyReply<http.ServerResponse>, ruleMap: any = undefined): Promise<number> {

  const column: ComponentBean = ComponentStore.getInstance().getColumn(value.constructor);
  if (column || ruleMap) {
    let options: ComponentColumnOptions = (ruleMap && { rules: ruleMap }) || (column && <ComponentColumnOptions>column.options);


    const keys: string[] = Object.keys(options.rules);
    for (let j: number = 0; j < keys.length; j++) {
      const key: string = keys[j];

      if (key === "isUpdate") continue;


      const ruleObject: any = options.rules[key];

      if (ruleObject.ignore) {
        delete value[key]; //不能更新
        continue;
      }

      if (value) {
        //对象必须存在
        //首先是类型判断

        if (value[key] === undefined) {
          response.send(HttpResult.toFail({ message: "缺少字段: " + key }));
          return -1;
        }

        const isnumber = value[key].constructor === String && ruleObject.type === Number && /^\d+(\.\d+)*$/.test(value[key]);

        if (ruleObject.type && value[key].constructor !== ruleObject.type) {
          if (!isnumber) {
            log.debug("类型不匹配:", value[key].constructor, ruleObject.type, key);
            response.send(HttpResult.toFail({ message: "类型不匹配: " + key }));
            return -1;
          }
        }

        if (ruleObject.rules) {

          for (let r: number = 0; r < ruleObject.rules.length; r++) {
            const rule: any = ruleObject.rules[r];


            if (rule.regx) {
              //regx的优先级最高, 如果regx设置, 则email, required等默认的格式验证, 则被忽略
              if (!rule.regx.test(value[key])) {
                let message: string = "字段格式不正确";
                if (rule.message) {
                  message = rule.message;
                }
                message = message + ":" + (ruleObject.label || key);

                response.send(HttpResult.toFail({ message: message }));

                log.debug(message);

                return -1;
              }
            } else {
              //
              if (rule.readonly) {
                if (value[key]) {
                  const dao = ObjectCreator.create(rule.dao);
                  const session: MongodbSession[] = [];
                  await handlerProperty.call(dao, dao.constructor, session);
                  const item = await dao[rule.method]({ [key]: value[key] });

                  closeSessionQuick(session); //关闭
                  if (item == null) {
                    if (rule.value && typeof rule.value === "function") {
                      value[key] = rule.value();
                    } else {
                      value[key] = new ObjectID().toHexString();
                    }
                  } else {
                    value["isUpdate"] = true; // 
                  }
                } else if (rule.value && typeof rule.value === "function") {
                  value[key] = rule.value();
                } else {
                  value[key] = new ObjectID().toHexString();
                }
              }

              /////

              if (rule.required) {
                let message: string = "请输入必要字段";

                if (typeof value[key] === "object") {
                  validateObject(value[key], response);
                } else {
                  if ((value[key] + "").valueOf().trim().length === 0) {
                    if (rule.message) {
                      message = rule.message;
                    }
                    message = message + ":" + (ruleObject.label || key);

                    response.send(HttpResult.toFail({ message: message }));

                    return -1;
                  } else if (rule.connect) {
                    const connect = rule.connect;
                    const dao = ObjectCreator.create(connect.dao);
                    const session: MongodbSession[] = [];
                    await handlerProperty.call(dao, dao.constructor, session);
                    const sourceItem = await dao[connect.method]({ [connect.key]: value[key] });
                    closeSessionQuick(session); //关闭

                    if (sourceItem === null) {
                      response.send(HttpResult.toFail({ message: "数据无法找到!" }));
                      log.debug("数据无法找到!");
                      return -1;
                    }
                  }
                }
              }

              if (rule.email) {
                const email = /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,4}$/;

                if (!email.test(value[key])) {
                  let message: string = "邮箱格式不正确";
                  if (rule.message) {
                    message = rule.message;
                  }
                  message = message + ":" + (ruleObject.label || key);

                  response.send(HttpResult.toFail({ message: message }));
                  log.debug(message);
                  return -1;
                }
              }

              //

              if (rule.unique) {
                //需要获取数据
                if (rule.dao && rule.method) {
                  const dao = ObjectCreator.create(rule.dao);
                  const session: MongodbSession[] = [];
                  await handlerProperty.call(dao, dao.constructor, session);
                  let item = null;
                  if (rule.self) {
                    const sourceItem = await dao[rule.method]({ [rule.key]: value[rule.key] });
                    if (sourceItem[key] !== value[key]) {
                      item = await dao[rule.method]({ [key]: value[key] });
                    }
                  } else {
                    item = await dao[rule.method]({ [key]: value[key] });
                  }

                  closeSessionQuick(session); //关闭
                  if (item !== null) {
                    let message: string = "当项数据已经存在";
                    if (rule.message) {
                      message = rule.message;
                    }
                    message = message + ":" + (ruleObject.label || key);
                    log.debug(message);
                    response.send(HttpResult.toFail({ message: message }));
                    return -1;
                  }
                }
              }
              //

              //////
            } //////////
          }
        }

        //然后在做rule的判断
      } else {
        //报错, 数据不存在
        response.send(HttpResult.toFail({ message: "类型不存在" }));
        log.debug("类型不存在");
        return -1;
      }
    }
  }

  return 1;
}
