import { erorrCode } from "./error";
import { HttpResult } from "../http";

export function responseJSON(json:string|object) {
  this.type("application/json")
  this.send(json)
}

export function responseHTML(html:string) {
  this.type("text/html");
  this.send(html)
}

export function responseImage(type:"png"|"jpg"|"jpeg"|"gif", buffer:Buffer) {
  this.type("image/" + type);
  this.send(buffer);
}

/**
 *   status: status,
    type: type,
    title: title,
    desc: desc,
    trace: trace,
    time: new Date()
 * @param isJson 
 * @param status 
 * @param message 
 */
export function responseError(isJson: boolean, status: string, message: string) {
  const error = erorrCode[status];
  let errortemplateContent:string|HttpResult = `<h1>发生了错误， 请确认错误信息。</h1>
  <p><strong>${error.title}</strong>[status=${error.status}, type=${error.type}]</p>
  <p>${error.desc||''}</p>
  <p></p>
  <p>${error.time}</p>
  <p><strong>trace：</strong> ${message}</p>
  `

  if(isJson) {
    errortemplateContent = HttpResult.fail({code: status, message: message})
  } else {
    this.type("text/html");
  }

  this.send(errortemplateContent);
}