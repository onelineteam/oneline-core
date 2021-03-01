export * from './validator';
export * from './object-creator';
import * as http from "http";
import { FastifyInstance } from "fastify";
import { FastifyRequest, FastifyReply } from "fastify";
import { ComponentStore, ComponentBean, ComponentActionOptions, ComponentParamOptions, ComponentPropertyOptions, ComponentColumnOptions } from "../component";
import { HttpRequest, HttpResponse } from "../http/in-out.http";
import { ObjectCreator } from "./object-creator";
import MongodbSession from "../db/mongodb";
import { HttpFilter } from "../http";
 
import { Templates, templateEngineRender, templateEngine } from '../decorator';
import { validateObject } from './validator';
import { responseError } from "./response";
import fastify = require('fastify');



export const app: FastifyInstance<http.Server, http.IncomingMessage, http.ServerResponse> = fastify();

 
app.setNotFoundHandler((req, reply) => {
  responseError.call(reply,  templateEngine.errorJsonFormat,  404, "Not Found");
})


 

// app.setErrorHandler((error, request, response) => {
//   console.log(error);
// })
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

  const methodPath = this.target.name + "__" + this.value.name;
  const template = Templates[methodPath];
  //函数调用
  try {

    let result: any = await bean[origin.name](...values);

    if (result) {
      if (template) {
        response.type(template[0] || templateEngine.type);
        log.debug(template[1])
        result = await templateEngineRender(template[1], template[2], result);
      }

      response.send(result);
    } else {
      log.debug("没有返回信息.......");
    }
  } catch (error) {

    let code = "2000"; 
    responseError.call(response, templateEngine.errorJsonFormat, code, error.toString());
    //有数据库
    // response.send(
    //   HttpResult.toFail({
    //     message: error.toString(),
    //     code: code
    //   })
    // );
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
      } else {
        delete object[key];
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


