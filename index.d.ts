
import { Http2ServerRequest, Http2ServerResponse } from 'http2';
import { FastifyReply, FastifyInstance, FastifyRequest } from 'fastify';
import { ServerResponse, IncomingMessage, Server } from 'http';
import { MongoClient, Db, FilterQuery, ClientSession, ObjectID } from 'mongodb';
/// <reference types="node" />
export {FastifyReply, FastifyRequest, FastifyInstance} from 'fastify';
export enum ComponentType {
	NORMAL = 0,
	VIEW = 1,
	SERVICE = 2,
	DAO = 3,
	PARAM = 4,
	PROPERTY = 5,
	COLUMN = 6
}
export type PARAMTYPE = 'NORMAL' | 'BODY' | 'FILE';
export class ComponentOptions {
	name?: string;
}
export class ComponentActionOptions extends ComponentOptions {
	path: string;
	method: any;
	paramtypes?: Array<any>;
	paramNames?: Array<string>;
	params?: object;
	actionName?: string;
	marker?: boolean;
}
export class ComponentPropertyOptions extends ComponentOptions {
	type: Function;
}
export class ComponentParamOptions extends ComponentOptions {
	type: Function;
	method: Function;
	methodName: string;
	index: number;
	aliasName: string;
	mode: PARAMTYPE;
	query?: any;
	rule?: any;
}
export class ComponentColumnOptions extends ComponentOptions {
	rules: Object;
}
export class ComponentBean {
	name: string;
	type: ComponentType;
	value: Object;
	target: Function;
	runtime: Boolean;
	options: ComponentOptions;
}
export class ComponentStore {
	private components:Map<string, ComponentBean>;;
	private static store;
	private constructor();
	static getInstance(): ComponentStore;
	add(key: string, value: ComponentBean): void;
	get(key: string): ComponentBean;
	has(key: string): Boolean;
	getComponents(): Map<string, ComponentBean>;
	getActions(): Map<String, ComponentBean>;
	getComponent(name: string): ComponentBean;
	getComponentsByFuncton(target: Function): Map<String, ComponentBean>;
	getParamName(component: ComponentBean, realParamName: string): string;
	getParamBody(component: ComponentBean, realParamName: string): ComponentBean;
	getProperty(target: Function): ComponentBean[];
	getColumn(target: Function): ComponentBean;
}

export function getParamsName(bean: ComponentBean, name: string): string;
export function getPropertyName(bean: ComponentBean, name: string): string;

export function getParameterNames(fn: Function): Array<string>;
export function getFuncParamsName(func: any): any[];

export function isArray(data: any): boolean;
export function isNumber(data: any): boolean;
export function isString(data: any): boolean;
export function isFunction(data: any): boolean;
export function isClass(data: any): boolean;
export function isDate(data: any): void;
export function Log(): void;
export interface OnelineLogOptions  {
  showMethodName?: boolean, 
  showConsoleColors?: boolean, 
  showLogLevel?: boolean, 
  showDev?: boolean
}

export function logSetting(options: OnelineLogOptions):void;


export function Action(options: ComponentActionOptions): (target: Object | Function, ...args: any[]) => void;
export function Get(path: string | ComponentActionOptions, actionName?: string, marker?: boolean): (target: Object | Function, ...args: any[]) => void;
export function Post(path: string | ComponentActionOptions, actionName?: string, marker?: boolean): (target: Object | Function, ...args: any[]) => void;
export function Delete(path: string | ComponentActionOptions, actionName?: string, marker?: boolean): (target: Object | Function, ...args: any[]) => void;
export function OPTIONS(path: string | ComponentActionOptions, actionName?: string, marker?: boolean): (target: Object | Function, ...args: any[]) => void;


export function Param(options?: string | any, mode?: PARAMTYPE): Function;
export function Body(options?: any): Function;
export function File(): Function;


export function Property(name?: string): (target: Object, propKey: string) => void;
export function Column(options: Object): (target: Object, propKey: string) => void;


export function Component(name?: string): (target: any) => void;

export function Type(type: string, temp: string, engine:string): (target: Object | Function, ...args: any[]) => void;
export function HtmlType(temp: string, engine?: string): (target: Object | Function, ...args: any[]) => void;



/// <reference types="fastify-cookie" />
/// <reference types="node" />

export class HttpRequest {
	request: any;
	constructor(request: any);
	getRequest(): any;
	getSession(): any;
}
export class HttpResponse {
	response: FastifyReply<ServerResponse>;
	constructor(response: FastifyReply<ServerResponse>);
	getResponse(): FastifyReply<ServerResponse>;
	setContentType(type: string): void;
	redirect(url: string): void;
	send(body: any): void;
}



export class ObjectCreator {
	static create(constructor: any): Object;
}


export function parsePage(total: number, index: number, size: number);

export interface Session {
	open(): any;
	close(): any;
	findCore(table: string, index: number, size: number, filter: Object, sort?: any): Promise<any[]>;
	find(table: string, filter: any, sort?: any, fields?: any): Promise<any[]>;
	saveItem(table: string, bean: Object): any;
	updateItem(table: string, bean: Object, filter: Object): any;
	deleteItem(table: string, filter: Object): any;
	findByNosql(table: string, key: string, sql: any): any;
}

export class MongodbSession implements Session {
	static database: string;
	static host: string;
	static port: number;
	static username: string;
	static password: string;
	static filter: (type: string, filter: any, fields?: any) => any;
	client: MongoClient;
	db: Db;
	constructor();
	open(): Promise<void>;
	findByNosql(table: any, key: string, sql: any): Promise<any>;
	findByForeign(table: string, join: Array<any>, index: number, size: number, filter: Object, lookup?: number, sort?: any): Promise<any[]>;
	findByForeignCount(table: string, join: Array<any>, filter: Object, lookup?: number): Promise<number>;
	findCore(table: string, index: number, size: number, filter: Object, sort?: any, fields?: any): Promise<any[]>;
	find(table: string, filter: any, sort: any, fields: any): Promise<any[]>;
	count(table: string, filter: FilterQuery<any>): Promise<number>;
	findItem(table: string, filter: FilterQuery<any>): Promise<any>;
	saveItem(table: string, bean: Object): Promise<import("mongodb").InsertOneWriteOpResult<Pick<any, string | number | symbol> & {
		_id: import("bson").ObjectId;
	}>>;
	saveList(table: string, beans: Array<Object>): Promise<import("mongodb").InsertWriteOpResult<Pick<any, string | number | symbol> & {
		_id: import("bson").ObjectId;
	}>>;
	updateItem(table: string, bean: Object, wheres: FilterQuery<any>): Promise<import("mongodb").UpdateWriteOpResult>;
	updateMany(table: string, bean: Object, wheres: FilterQuery<any>): Promise<import("mongodb").UpdateWriteOpResult>;
	deleteItem(table: string, wheres: FilterQuery<any>): Promise<import("mongodb").DeleteWriteOpResultObject>;
	deleteList(table: string, wheres: FilterQuery<any>): Promise<import("mongodb").DeleteWriteOpResultObject>;
	close(): void;
}



export class HttpResult {
	code: string;
	message: string;
	data: any;
	success: boolean;
	extra: any;
	static create(): HttpResult;
	static toOk(options: any): HttpResult;
	static ok(options: any): HttpResult;
	static toFail(options: any): HttpResult;
	static fail(options: any): HttpResult;
}



/// <reference types="node" />
/// <reference types="fastify-cookie" />

export abstract class HttpFilter {
	abstract chain(app: FastifyInstance, request: FastifyRequest<IncomingMessage>, response: FastifyReply<ServerResponse>, key?: String, bean?: ComponentBean): Promise<{
		success: boolean;
		message: string;
		break?: boolean;
		code?: string;
	}>;
}



/// <reference types="node" />
/// <reference types="fastify-cookie" />

export const app: FastifyInstance<Server, IncomingMessage, ServerResponse>;
export let filters: any[];
export function initDb(options: any): void;
export function init(): void;
export function closeSession(bean: Object, level?: number): void;
export function closeSessionQuick(session: MongodbSession[]): void;
export function handlerProperty(bean: Function, session?: MongodbSession[]): Promise<void>;
export function validateObject(value: Object, response: FastifyReply<ServerResponse>, ruleMap?: any): Promise<number>;



/// <reference types="node" />
/// <reference types="fastify-multipart" />
/// <reference types="@/types/fasity" />
/// <reference types="fastify" />
/// <reference types="fastify-cookie" />

export const WayMultipart: (instance: FastifyInstance<import("http").Server, IncomingMessage, ServerResponse>, options: any, callback: (err?: import("fastify").FastifyError) => void) => void;



// export type FastifyReply = any<T>;
// export type FastifyRequest = any;
// export type FastifyInstance = any;
export function start(port: number, options?: WayOptions, filtersOut?: Object[], callback?: Function): any;


export interface Dao<T> {
	findList(index: number, size: number, filter?: any, sort?: any): any;
	findListAll(filter: any, fields?: any, sort?: any): any;
	findItem(filter: Object): any;
	findCount(filter: Object): any;
	findSum(field: string, filter: any, privateData?: boolean): any;
	findListForeign(join: any[], index: number, size: number, filter: any, lookup?: number, sort?: any): any;
	findItemForeign(join: any[], filter: any): any;
	save(object: T | T[]): any;
	update(object: T, filter: FilterQuery<any>): any;
	updateMany(entry: T, filter: FilterQuery<any>): any;
	delete(filter: Object, multi?: boolean): any;
}
export abstract class DefaultDao<T> implements Dao<T> {
	abstract table: string;
	abstract session: MongodbSession;
	findListForeign(join: any[], index: number, size: number, filter?: any, lookup?: number, sort?: any): Promise<any[]>;
	findByForeignCount(join: Array<any>, filter: Object, lookup?: number): Promise<number>;
	findByNosql(key: string, noql: any): Promise<any>;
	findList(index: number, size: number, filter?: any, sort?: any): Promise<any[]>;
	findListAll(filter?: any, fields?: any, sort?: any): Promise<any[]>;
	findItemForeign(join: any[], filter?: any): Promise<any>;
	findItem(filter: Object): Promise<any>;
	findCount(filter?: Object): Promise<number>;
	findSum(field: string, filter: any, privateData?: boolean): Promise<any>;
	save(entry: T | T[]): Promise<import("mongodb").InsertOneWriteOpResult<Pick<any, string | number | symbol> & {
		_id: ObjectID;
	}> | import("mongodb").InsertWriteOpResult<Pick<any, string | number | symbol> & {
		_id: ObjectID;
	}>>;
	operationByTransaction(callback: (cs: ClientSession, db: Db) => void): Promise<boolean>;
	update(entry: T, filter: FilterQuery<any>): Promise<import("mongodb").UpdateWriteOpResult>;
	updateMany(entry: T, filter: FilterQuery<any>): Promise<import("mongodb").UpdateWriteOpResult>;
	delete(filter: Object, multi?: boolean): Promise<import("mongodb").DeleteWriteOpResultObject>;
	transaction(callback: (cs: ClientSession, db: Db) => void, options: any):Promise<Boolean>;
}



export interface Service<T> {
	findList(index: number, size: number, filter?: any, sort?: any, fields?: any): any;
	save(object: T | T[]): any;
	update(object: T, filter: Object): any;
	updateMany(object: T, filter: Object): any;
	delete(id: string): any;
}
export abstract class DefaultService<T> implements Service<T> {
	abstract dao: Dao<T>;
	findList(index: number, size: number, filter?: any, sort?: any): Promise<{
		rows: any;
		page: {
			total: any;
		};
	}>;
	findListBy(join: any, index: number, size: number, filter?: any, sort?: any): Promise<any>;
	findCount(filter?: any): Promise<any>;
	findSum(field: any, filter: any, privateData?: boolean): Promise<any>;
	findListAll(filter?: any, fields?: any, sort?: any): Promise<any>;
	findListAllBy(filter: any, foreign?: boolean, join?: any[]): Promise<any>;
	findItem(id: string): Promise<any>;
	findItemBy(filter: any, foreign?: boolean, join?: any[]): Promise<any>;
	save(object: T | T[]): Promise<any>;
	update(object: T, filter: Object): Promise<any>;
	updateMany(object: T, filter: Object): Promise<any>;
	delete(id: string): Promise<any>;
	deleteBy(filter: Object, multi?: boolean): Promise<any>;
	transaction(callback: (cs: ClientSession, db: Db) => void, options?: any):Promise<Boolean>;
}


export function Notice(name: string, code: string): void;




// export type HttpRequest = IncomingMessage | Http2ServerRequest;
// export type HttpResponse = ServerResponse | Http2ServerResponse; 
// namespace fastify {

	// const maxAge: unique symbol = Symbol('maxAge')
	// const secretKey: unique symbol = Symbol('secretKey')
	// const sign: unique symbol = Symbol('sign')
	// const addDataToSession: unique symbol = Symbol('addDataToSession')

	// interface Session {
	//   new (cookieOpts: Object, secret: string, prevSession:Object)
	//   touch();
	//   regenerate();
	//   [maxAge]();

	// }
// }


export interface WayOptions {
	db?: WayDBOptions;
	cros?: WayCrosOptions;
	static?:{prefix?: string, path: string}
}

export interface WayDBOptions {
	host: string;
	port: number;
	username: string;
	password: string;
	database: string;
}

export interface WayCrosOptions {
	origin?: string | string[] | Boolean | Function;
	methods?: string | string[];
	allowedHeaders?: string | string[];
	exposedHeaders?: string | string[];
	preflight?: Boolean,
	credentials?: Boolean
}

export interface WayLog {
	error(...args:any[]): void;
	debug(...args:any[]): void;
	info(...args:any[]): void;
}

export const log:WayLog;

export const idGenerator: {
	objectId(id?: string): string;
};


export class Start {
  addEngine(type: string, engine:(temp: string, context:any) => Promise<string>|string):Start;
  setHandlebarsEngine(engine:any):Start;
  setEjsEngine(engine:any):Start;
  setEngineOptions(options:any):Start;
  setView(path: string):Start;
  setDefaultEngine(engineName: string):Start;
  setErrorJsonFormat(isJson: boolean):Start;
  configCors(cors: WayCrosOptions):Start;
  configStatic(prefix: string, path: string):Start;
  configLog(showed: boolean):Start;
  configUploadSize(size: number):Start;  
  configDb(config:WayDBOptions):Start;
  addFilter(filter: HttpFilter):Start;
  start(port: number, host:string, callback: Function):FastifyInstance;
  start(port: number, hostCallback:string|Function, callback?: any):FastifyInstance;
}




declare module 'fastify' {
	interface FastifyRequest<HttpRequest> {
		session: any;
	}
}