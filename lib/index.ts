export * from './utils';
export * from './decorator';
export * from './runtime';
export * from './http';
export * from './db';
export * from './component';
export const { FastifyReply, FastifyRequest, FastifyInstance } = require('fastify');

import { HttpFilter } from './http';
import { app, init, initDb, filters } from './runtime';
import { templateEngine } from './decorator';
import { IncomingMessage } from 'http';
import { WayMultipart } from './plugins';
import * as xml from 'xml-js';
import { Log, logSetting } from './utils';



///
/**
 * 即将取消该函数
 */
export function start(port: number, options?: WayOptions, filtersOut?: Object[], callback?: (error: Error, address: string) => void) {

  
  //日志处理
  if (!Log["$log"]) {
    logSetting({ showDev: false });
  }

  if (options.jsEngine) {
    Object.keys(options.jsEngine).forEach(key => templateEngine[key] = options.jsEngine[key])
  }

  //
  app.addContentTypeParser(['text/xml', 'application/xml'], { parseAs: 'string' }, function (req: IncomingMessage, body: string, done) {

    try {
      const data = xml.xml2js(body, { compact: true, trim: true })

      done(null, data);
    } catch (error) {
      done(new Error("解析xml错误"), undefined);
    }



  })
  //

  app.addContentTypeParser(['text', 'text/html', 'text/plain'], { parseAs: 'string' }, (req, body, done) => {
    done(null, body);
  })


  //
  // const webapp = path.join(path.resolve(__dirname, "../../"), 'webapp')
  // log.debug(webapp);
  options && options.static && app.use(options.static.prefix || 'static', require("serve-static")(options.static.path))

  app.register(WayMultipart, { limits: { fileSize: 1024 * 1024 * 15 * 1024 } });

  //注册cookie, session
  app.register(require('fastify-cookie'));
  app.register(require('fastify-session'), {
    cookieName: 'sessionId',
    secret: "99d7707351368129234526da9a01c615",
    cookie: {
      secure: false,
      // domain: '172.20.10.111',
      // expires: moment().add(1, "days").toDate().toString()
      // expires: new Date().getTime() + 90000000
      maxAge: 1000 * 60 * 60 * 24
    },
  });

  if (options && options.db) initDb(options.db);
  init();

  if (options && options.cros) {
    app.register(require('fastify-cors'), {
      ...options.cros
    })
  }

  if (filtersOut) {
    filters.push(...filtersOut);
  }

  // app.listen()
  app.listen(port, "0.0.0.0", callback);

  return app;
}



//这里即将使用
export class Start {

  addEngine(type: string, engine:(temp: string, context:any) => Promise<string>|string) {
    templateEngine.addEngine(type, engine);
    return this;
  }

  setHandlebarsEngine(engine:any) {
    templateEngine.setHandlebarsEngine(engine);
    return this;
  }

  setEjsEngine(engine:any) {
    templateEngine.setEjsEngine(engine);
    return this;
  }

  setEngineOptions(options:any) {
    templateEngine.setOptions(options);
  }

  setView(path: string) {
    templateEngine.setViewPath(path);
    return this;
  }

  setDefaultEngine(engineName: string) {
    templateEngine.defaultEngine = engineName;
    return this;
  }

  setErrorJsonFormat(isJson: boolean) {
    templateEngine.errorJsonFormat = isJson;
    return this;
  }

  configCors(cors: WayCrosOptions) {
    app.register(require('fastify-cors'), {
      ...cors
    })
    return this;
  }

  configStatic(prefix: string = "static", path: string) {
    app.use(prefix, require("serve-static")(path));
    return this;
  }


  configLog(showed: boolean) {
    logSetting({ showDev: showed });
    return this;
  }


  configUploadSize(size: number = 1024 * 1024 * 15 * 1024) {
    app.register(WayMultipart, { limits: { fileSize: size } });
    return this;
  }


  configDb(config) {
    initDb(config)
    return this;
  }

  initParse() {

    //
    app.addContentTypeParser(['text/xml', 'application/xml'], { parseAs: 'string' }, function (req: IncomingMessage, body: string, done) {
      try {
        const data = xml.xml2js(body, { compact: true, trim: true })

        done(null, data);
      } catch (error) {
        done(new Error("解析xml错误"), undefined);
      }

    })
    //

    app.addContentTypeParser(['text', 'text/html', 'text/plain'], { parseAs: 'string' }, (req, body, done) => {
      done(null, body);
    })



  }

  initPlugins() {
    app.register(require('fastify-cookie'));
    app.register(require('fastify-session'), {
      cookieName: 'sessionId',
      secret: "99d7707351368129234526da9a01c615",
      cookie: {
        secure: false,
        // domain: '172.20.10.111',
        // expires: moment().add(1, "days").toDate().toString()
        // expires: new Date().getTime() + 90000000
        maxAge: 1000 * 60 * 60 * 24
      },
    });
  }


  addFilter(filter: HttpFilter) {
    filters.push(filter);
    return this;
  }

  start(port: number, host:string, callback: Function):any;
  start(port: number, hostCallback:string|Function = "0.0.0.0", callback?: any):any {

    this.initParse();
    this.initPlugins();
    init();

    const host = typeof hostCallback === "string" ? hostCallback: 'localhost';
    callback = hostCallback instanceof Function ? hostCallback: callback;

    app.listen(port, host, callback);

    return app;

  }
}