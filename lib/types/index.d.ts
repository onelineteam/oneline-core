declare interface WayOptions {
  db?: WayDBOptions;
  cros?: WayCrosOptions;
  static?: {prefix: string, path: string},
  jsEngine?:any;
}

declare interface WayDBOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

declare interface WayCrosOptions {
  origin?: string|string[]|Boolean|Function;
  methods?: string|string[];
  allowedHeaders?: string|string[];
  exposedHeaders?: string|string[];
  preflight?:Boolean,
  credentials?: Boolean
}

interface WayLog {
  error(...args);
  debug(...args);
  info(...args);
}
declare var log: WayLog;