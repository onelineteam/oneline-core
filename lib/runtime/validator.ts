//处理参数
// 1. 请求对象, 响应对象
// 2. 请求参数
// 3. 请求体

import { ComponentBean, ComponentStore, ComponentColumnOptions, HttpResult, MongodbSession, handlerProperty, closeSessionQuick, isArray } from "..";
import { FastifyReply } from "fastify";
import { ObjectCreator } from "./object-creator";
import { ObjectID } from "mongodb";
import * as http from "http";

export async function validateObject(value: Object, response: FastifyReply<http.ServerResponse>, ruleMap: any = undefined): Promise<number> {

  const column: ComponentBean = ComponentStore.getInstance().getColumn(value.constructor);
  const keeps: any[] = [];
  if (column || ruleMap) {
    let options: ComponentColumnOptions = (ruleMap && { rules: ruleMap }) || (column && <ComponentColumnOptions>column.options);


    const keys: string[] = Object.keys(options.rules);
    for (let j: number = 0; j < keys.length; j++) {
      const key: string = keys[j];

      if (key === "isUpdate") continue;


      const ruleObject: any = options.rules[key];

      const ignoreRule = ruleObject.rules.find(rule => rule.ignore);
      // const readonlyIndex = ruleObject.rules.findIndex(rule => rule.readonly);
      const requiredIndex = ruleObject.rules.findIndex(rule => rule.required);
      if (ignoreRule && ignoreRule.ignore && (!ignoreRule.keep)) {
        delete value[key]; //不能更新
        continue;
      }

      if (ignoreRule && ignoreRule.ignore && ignoreRule.keep) {
        keeps.push(key);
      }

      if (value) {
        //对象必须存在
        //首先是类型判断

        // console.log(value, key, value[key])

        if (value[key] === undefined && requiredIndex > -1) {
          response.send(HttpResult.toFail({ message: "缺少字段: " + (ruleObject.label || key) }));
          return -1;
        }

        if (value[key]) {

          if (ruleObject.type && value[key].constructor !== ruleObject.type) {
            const isnumber = value[key].constructor === String && ruleObject.type === Number && /^\d+(\.\d+)*$/.test(value[key]);
            if (!isnumber) {
              log.debug("类型不匹配:", value[key].constructor, ruleObject.type, key);
              response.send(HttpResult.toFail({ message: "类型不匹配: " + (ruleObject.label || key) }));
              return -1;
            }
          }

        }


        if (ruleObject.rules) {

          for (let r: number = 0; r < ruleObject.rules.length; r++) {
            const rule: any = ruleObject.rules[r];


            if (rule.regx && value[key]) {
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
            }
            //
            if (rule.readonly) {
              if (value[key] && rule.dao) {
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

            if (rule.email && value[key]) {
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

                const filter: any = { [key]: value[key] };
                if (rule.related && isArray(rule.related)) {
                  rule.related.forEach(item => {
                    if (!value.hasOwnProperty(item)) throw new Error("实体类没有当前字段：" + item);
                    filter[item] = value[item];
                  })
                }

                if (rule.self) {
                  const sourceItem = await dao[rule.method]({ [rule.key]: value[rule.key] });
                  if (sourceItem[key] !== value[key]) {
                    item = await dao[rule.method]({ ...filter });
                  }
                } else {
                  item = await dao[rule.method]({ ...filter });
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
            //////////
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

  //最后删除ignore, keep为true的. keep为true,在验证过程中有作用, 用完后,即可删除
  keeps.forEach(k => {
    delete value[k];
  })

  return 1;
}