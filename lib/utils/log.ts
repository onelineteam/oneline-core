import * as Logger from '@keep2zero/vuejs-logger';
///日志
export function Log() {};

export interface OnelineLogOptions  {
  showMethodName?: boolean, 
  showConsoleColors?: boolean, 
  showLogLevel?: boolean, 
  showDev?: boolean
};

export function logSetting(options: OnelineLogOptions) {
  options = Object.assign({showMethodName: true, showConsoleColors: true, showLogLevel: true, showDev: true}, options);
  Logger.default.install(Log, options);
  global["log"] = Log['$log'];
  // console.log("log 实例化", log)
}
logSetting({showDev: false});

export const log:WayLog = Log["$log"];