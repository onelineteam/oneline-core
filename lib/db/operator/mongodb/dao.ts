import { FilterQuery, ObjectID, ClientSession, Db } from "mongodb";
import { MongodbSession, Component } from "../../..";

const primaryObject = [String, Boolean, Number, Array, Object, Function, Date, Math, Set];
export default interface Dao<T> {
  findList(index: number, size: number, filter?: any, sort?: any);
  findListAll(filter: any, fields?: any, sort?: any);
  findItem(filter: Object, fields?: any);
  findCount(filter: Object);
  findSum(field: string, filter: any, privateData?: boolean);

  findListForeign(join: any[], index: number, size: number, filter: any, lookup?: number, sort?: any);
  findItemForeign(join: any[], filter: any);

  save(object: T | T[]);
  update(object: T, filter: FilterQuery<any>);
  updateMany(entry: T, filter: FilterQuery<any>);
  delete(filter: Object, multi?: boolean);
  transaction(callback: (cs: ClientSession, db: Db) => void, binds: any, options: any, sessionOption?: any): Promise<boolean>;
}

@Component()
export abstract class DefaultDao<T> implements Dao<T> {
  abstract table: string; //必须指定
  abstract session: MongodbSession; //必须制定



  async batch(callback:Function, isOrder: boolean = false) {
   await this.session.batch(this.table, isOrder, callback);
  }

  async findListForeign(join: any[], index: number, size: number, filter: any = {}, lookup: number = 0, sort: any = {}) {
    return await this.session.findByForeign(this.table, join, index, size, filter, lookup, sort);
  }

  async findByForeignCount(join: Array<any>, filter: Object, lookup: number = 0) {
    return await this.session.findByForeignCount(this.table, join, filter, lookup);
  }

  async findByNosql(key: string, noql: any) {
    return await this.session.findByNosql(this.table, key, noql);
  }

  async findList(index: number, size: number, filter?: any, sort?: any) {
    log.debug("==================>", sort);
    return await this.session.findCore(this.table, index, size, filter, sort);
  }

  async findListAll(filter: any = {}, fields: any = {}, sort: any = {}) {
    log.debug(filter);
    return await this.session.find(this.table, filter, sort, fields);
  }

  async findItemForeign(join: any[], filter: any = {}) {
    const items = await this.findListForeign(join, 1, 1, filter);
    if (items.length > 0) return items[0];
    return null;
  }

  async findItem(filter: Object, fields:any={}) {
    log.debug(this.table, "开始查询单个:", filter);
    return await this.session.findItem(this.table, filter, fields);
  }

  async findCount(filter: Object = {}) {
    log.debug("count: filter -> ", filter);
    return await this.session.count(this.table, filter);
  }

  async findSum(field: string, filter: any, privateData: boolean = false) {
    const sql = await this.session.findByNosql(this.table, "aggregate", [
      { $match: filter },
      {
        $group: {
          _id: null,
          sum: { $sum: "$" + field },
          count: { $sum: 1 }
        }
      }
    ]);

    const result = await sql.toArray();

    if (privateData) {
      if (result.length == 0) {
        return { sum: 0, count: 0 };
      }

      return result[0];
    } else {
      if (result.length == 0) {
        return 0;
      }

      return result[0].sum;
    }
  }

  async save(entry: T | T[]) {
    if (entry instanceof Array) {
      return await this.session.saveList(this.table, entry);
    }
    return await this.session.saveItem(this.table, entry);
  }


  async transaction(callback: (cs: ClientSession, context: any) => void, binds: any = [], options: any = { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } }, sessionOption?: any) {
    let ok = false;

    const session = this.session.client.startSession(sessionOption);
    try {
      await session.startTransaction(options);

      if (Array.isArray(binds)) {
        //
        binds.forEach((item: any) => {
          item.dao.session.options = { ...item.dao.session.options, session }
        })
      } else {
        findMongoSessionTransaction(binds, session);
      }

      // await session.withTransaction(async () => {
      //   callback(session, this.session.db);
      // }, options);
      await callback(session, this.session);
      await session.commitTransaction();
      ok = true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

    return true;

  }

  async operationByTransaction(callback: (cs: ClientSession, db: Db) => void) {
    const clientSession = this.session.client.startSession();
    let ok = false;
    await clientSession.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" }
    });

    try {
      await callback(clientSession, this.session.db);

      await clientSession.commitTransaction();

      ok = true;
    } catch (error) {
      log.debug("transaction 错误哦了:", error.message);

      await clientSession.abortTransaction();
    } finally {
      log.debug("提交事务: ----------->");

      await clientSession.endSession();
    }

    return ok;
  }

  async update(entry: T, filter: FilterQuery<any>) {
    return await this.session.updateItem(this.table, entry, filter);
  }

  async updateMany(entry: T, filter: FilterQuery<any>) {
    return await this.session.updateMany(this.table, entry, filter);
  }

  async delete(filter: Object, multi: boolean = false) {
    if (multi) {
      return await this.session.deleteList(this.table, filter);
    }
    return await this.session.deleteItem(this.table, filter);
  }
}

/**
 * 递归注入事务session
 * @param context 
 * @param session 
 */
function findMongoSessionTransaction(context: any, session: any) {

  if (context instanceof MongodbSession) {
    context.options = Object.assign(Object.assign({}, context.options), { session });
  } else if (context && context.constructor && primaryObject.indexOf(context.constructor) === -1) {

    Object.getOwnPropertyNames(context).forEach(item => {
      findMongoSessionTransaction(context[item], session);
    });
  }


}