import * as Logger from '@keep2zero/vuejs-logger';
import * as fs from 'fs';
import { time_now } from '.';
///日志
export function Log() { };

export interface OnelineLogOptions {
  showMethodName?: boolean,
  showConsoleColors?: boolean,
  showLogLevel?: boolean,
  showDev?: boolean,
  logFile?: string,
};

export function logSetting(options: OnelineLogOptions) {
  options = Object.assign({ showMethodName: true, showConsoleColors: true, showLogLevel: true, showDev: true }, options);
  Logger.default.install(Log, options);
  Log['$log']["file"] = (...args) => {
    let format = `${time_now()}: ${args.join(" ")}`;
    const logfile = options.logFile || "onelined.log";
    fs.appendFile(logfile, format, (err) => {
      err && Log['$log'].debug(err);
    });

  }
  global["log"] = Log['$log'];
  // console.log("log 实例化", log)
}
logSetting({ showDev: false });

export const log: WayLog = Log["$log"];