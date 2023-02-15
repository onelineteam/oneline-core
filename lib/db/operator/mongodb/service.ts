import Dao from "./dao";
import { ObjectId } from "bson";
import { Component, parsePage } from "../../../";
import { ClientSession, Db } from "mongodb";
export interface Service<T> {
  findList(index: number, size: number, filter?: any, sort?: any, fields?: any);
  save(object: T | T[]);
  update(object: T, filter: Object);
  updateMany(object: T, filter: Object);
  delete(id: string);
  transaction(callback: (cs: ClientSession, db: Db) => void, binds?:any, options?: any, sessionOptions?: any):Promise<boolean>;
}


export abstract class DefaultService<T> implements Service<T> {
  abstract dao: Dao<T>;
  async findList(index: number, size: number, filter: any = {}, sort: any = {}) {

    const total = await this.dao.findCount(filter);
    const page = parsePage(total, index, size);

    return {
      rows: await this.dao.findList(index, size, filter, sort),
      page: page
    };
  }

  async findListBy(join: any, index: number, size: number, filter: any = {}, sort: any = {}) {
    return await this.dao.findListForeign(join, index, size, filter, 0, sort)
  }

  async findCount(filter: any = {}) {
    return await this.dao.findCount(filter);
  }

  async findSum(field, filter, privateData: boolean = false) {
    return await this.dao.findSum(field, filter, privateData);
  }


  async findListAll(filter: any = {}, fields: any = {}, sort: any = {}) {
    return await this.dao.findListAll(filter, fields, sort);
  }

  async findListAllBy(filter: any, foreign: boolean = false, join: any[] = []) {
    if (foreign) {
      return await this.dao.findListForeign(join, 1, 1000, filter)
    }
    return this.findListAll(filter, {}, {});
  }

  async findItem(id: string, fields: any = {}) {
    return await this.dao.findItem({ _id: id }, fields);
  }

  async findItemBy(filter: any, fields:any = {}, foreign: boolean = false, join: any[] = []) {
    if (foreign) {
      return await this.dao.findItemForeign(join, {...filter, $project: fields});
    }
    return await this.dao.findItem(filter, fields);
  }

  async save(object: T | T[]) {
    return await this.dao.save(object);
  }

  async update(object: T, filter: Object) {
    return await this.dao.update(object, filter);
  }

  async updateMany(object: T, filter: Object) {
    return await this.dao.updateMany(object, filter);
  }

  async delete(id: string) {
    return await this.dao.delete({ _id: new ObjectId(id) });
  }

  async deleteBy(filter: Object, multi: boolean = false) {
    log.debug("--------->delete ", filter, multi);
    return await this.dao.delete(filter, multi);
  }

  async transaction(callback: (cs: ClientSession, db: Db) => void, binds?: any, options?: any, sessionOptions?: any) {
    return await this.dao.transaction(callback, binds, options, sessionOptions);
  }
}
