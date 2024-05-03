// import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import { parsePathParams } from '@oneline/utils';
import { isOs } from '..';

class TemplateEngine {
  errorJsonFormat: boolean = true;
  type: string = 'application/json';
    rootPath: string = path.resolve();
 
  viewPath: string = "view";
  options: any = {};
  engines: any = {};
  handlebarsEngine: any = null;
  ejsEngine: any = null;
  defaultEngine: string = "handlebars";


  constructor() {


    this.engines["handlebars"] = (temp, context) => {
      if (this.handlebarsEngine == null) throw new Error("请先设置你的handlebarsEngine");

      try {
        const tempPath = (isOs(["linux", "darwin"]) ? '/':'') + parsePathParams([this.rootPath, this.viewPath, temp].join("/"), context);
        //const source = fs.readFileSync(["/", tempPath].join("")).toString('utf-8');
        const source = fs.readFileSync(tempPath).toString('utf-8');
        return this.handlebarsEngine.compile(source)(context, this.options);
      } catch (err) {
        throw err;
      }

    }

    this.engines.ejs = (temp, context) => {
      if (this.ejsEngine == null) throw new Error("请先设置你的ejsEngine");
      const promises = (resolve, inject) => {
        // const source = fs.readFileSync([this.rootPath, this.viewPath,temp].join("/")).toString('utf-8');
        // const html = this.ejsEngine.render(source, context, this.options);
        // resolve(html);
        try {
          const filePath =  (isOs(["linux", "darwin"]) ? '/':'') + parsePathParams([this.rootPath, this.viewPath, temp].join("/"), context);
          this.ejsEngine.renderFile(filePath, context, this.options, (err, result) => {
            if (err) {
              log.debug(err);
              inject(err);
            }
            resolve(result);
          })
        } catch (error) {
          throw error;
        }
      }
      return new Promise(promises);
    }

  }

  setErrorJsonFormat(isJson: boolean) {
    return this.errorJsonFormat = isJson;
  }

  setOptions(options: any) {
    this.options = options;
  }

  setViewPath(viewPath: string) {
    this.viewPath = viewPath;
  }

  addEngine(type: string, engine: (temp, context) => Promise<string> | string) {
    this.engines[type] = engine;
  }

  setEjsEngine(engine: any) {
    this.ejsEngine = engine;
  }

  setHandlebarsEngine(engine: any) {
    this.handlebarsEngine = engine;
  }

}


/**
 * 引擎类型。
 * ejs: render, options, 
 */

export const Templates = {};
export const templateEngine = new TemplateEngine();

export async function templateEngineRender(engine: string, template: string, context: any) {
  if (!templateEngine.engines[engine]) throw new Error("还未设置该引擎: " + engine);
  return await templateEngine.engines[engine](template, context, templateEngine.viewPath);
}

export function Type(type: string, temp: string, engine: string) {
  return function (target: Object, methodName?: string, config?: any) {
    const key = target.constructor.name + "__" + methodName;
    Templates[key] = [type, engine, temp];
    // return config;
  }
}

export function HtmlType(temp: string, engine: string) {
  return Type("text/html", temp, engine || templateEngine.defaultEngine);
}