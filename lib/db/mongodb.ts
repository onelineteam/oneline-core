import { MongoClient, Db, FilterQuery } from "mongodb";
import Session from "./session";
import { isArray } from "util";

export default class MongodbSession implements Session {
    static database: string;
    static host: string;
    static port: number;
    static username: string;
    static password: string;
    static filter: (type: string, filter: any, fields?: any) => any;

    client: MongoClient;
    db: Db;

    constructor() {
        this.client = require("mongodb").MongoClient;
        // this.open();
    }

    async open() {
        const url = `mongodb://${MongodbSession.username}:${MongodbSession.password}@${MongodbSession.host}:${MongodbSession.port}`;
        log.debug(url);
        this.client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
        this.db = await this.client.db(MongodbSession.database);
    }

    async findByNosql(table, key: string, sql: any) {
        log.debug("开始查询语句:", sql);
        return await this.db.collection(table)[key](sql);
    }

    /**
     * join为:
     * [{table: string, field: string, foreign: string, asname: string, specific: {}}]
     * @param table
     * @param join
     * @param index
     * @param size
     * @param filter
     */
    async findByForeign(table: string, join: Array<any>, index: number, size: number, filter: Object, lookup: number = 0, sort: any = {}) {
        let filters: any = [];
        const unique = [];
        let project = {};
        join.forEach((item: any) => {
            if (lookup === 0) {
                if(item.pipeline) {
                    const lk:any = {from: item.table, as: item.asname};
                    if(item.let) {
                        lk.let = item.let
                    }
                    lk.pipeline = item.pipeline;
                    filters.push({ $lookup: lk });
                } else {
                    filters.push({ $lookup: { from: item.table, localField: item.field, foreignField: item.foreign, as: item.asname } });

                }
            }
            if (lookup === 1) {
                filters.push({ $graphLookup: { from: item.table, startWith: "$" + item.field, connectFromField: item.field, connectToField: item.foreign, as: item.asname, maxDepth: 15 } });
            }
            if (item.specific) {
                project  = {...project, ...item.specific};
            }
            if (item.unique) {
                //暂时不需要了, 如果某个字段为空, 则数据就查询不到
                unique.push({ $unwind: "$" + item.asname });
                // filters.push({$unwind: '$' + item.asname})
            }

            // if(item.filter) {
            //    [item.asname]
            // }
        });

        if (Object.keys(project).length > 0) filters.push({ $project: project });
        if (unique.length > 0) filters.push(...unique);

        if (MongodbSession.filter) {
            filters = MongodbSession.filter("findByForeign", filters);
        }

        //处理过滤条件
        Object.keys(filter).forEach(key => {
            const item = filter[key];
            if(isArray(item)) {
                filter[key] = {$in: item};
            }
        })

        //

        filters.unshift({ $match: filter });
        if (Object.keys(sort).length > 0) {
            filters.push({ $sort: sort });
        }

        log.debug("查询语句:", filters);
        const data = await this.db
            .collection(table)
            .aggregate(filters, { collation: { locale: "zh", numericOrdering: true } })
            .skip((index - 1) * size)
            .limit(size);

        return data.toArray();
    }

    async findByForeignCount(table: string, join: Array<any>, filter: Object, lookup: number = 0) {
        let filters: any = [];
        const unique = [];
        let project = {};
        join.forEach((item: any) => {
            if (lookup === 0) {
                if(item.pipeline) {
                    const lk:any = {from: item.table, as: item.asname};
                    if(item.let) {
                        lk.let = item.let
                    }
                    lk.pipeline = item.pipeline;
                    filters.push({ $lookup: lk });
                } else {
                    filters.push({ $lookup: { from: item.table, localField: item.field, foreignField: item.foreign, as: item.asname } });

                }
            }
            if (lookup === 1) {
                filters.push({ $graphLookup: { from: item.table, startWith: "$" + item.field, connectFromField: item.field, connectToField: item.foreign, as: item.asname, maxDepth: 15 } });
            }
            if (item.specific) {
                // project[item.asname] = item.specific;
                project = {...project, ...item.specific};
            }
            if (item.unique) {
                //暂时不需要了, 如果某个字段为空, 则数据就查询不到
                unique.push({ $unwind: "$" + item.asname });
                // filters.push({$unwind: '$' + item.asname})
            }

            // if(item.filter) {
            //    [item.asname]
            // }
        });

        if (Object.keys(project).length > 0) filters.push({ $project: project });
        if (unique.length > 0) filters.push(...unique);

        if (MongodbSession.filter) {
            filters = MongodbSession.filter("findByForeign", filters);
        }

        //处理过滤条件
        Object.keys(filter).forEach(key => {
            const item = filter[key];
            if(isArray(item)) {
                filter[key] = {$in: item};
            }
        })

        filters.unshift({ $match: filter });
        filters.push({ $count: "count" });

        const data = await this.db
            .collection(table)
            .aggregate(filters, { collation: { locale: "zh", numericOrdering: true } })
            .toArray();

        log.debug("计数:", data);
        let count = 0;
        if (data && data.length > 0) {
            count = data[0]["count"];
        }
        return count;
    }

    async findCore(table: string, index: number, size: number, filter: Object, sort: any = {}, fields: any = {}) {
        if (MongodbSession.filter) {
            filter = MongodbSession.filter("findCore", filter);
        }
        log.debug(".........sort:", sort, ".......filter", filter);
        const data = await this.db
            .collection(table)
            .find(filter, fields)
            .collation({ locale: "zh", numericOrdering: true })
            .skip((index - 1) * size)
            .limit(size)
            .sort(sort);
        return data.toArray();
    }

    async find(table: string, filter: any, sort: any, fields: any): Promise<any[]> {
        log.debug("开始查询数据", table, filter);
        const data = await this.findCore(table, 0, 0, { ...filter }, sort, fields);
        // const data = await this.db.collection(table).find({}, {}).toArray();
        // log.debug("数据:", data);
        return data;
    }

    async count(table: string, filter: FilterQuery<any>): Promise<number> {
        if (MongodbSession.filter) {
            filter = MongodbSession.filter("count", filter);
        }

        return await this.db.collection(table).countDocuments(filter);
    }

    async findItem(table: string, filter: FilterQuery<any>) {
        if (MongodbSession.filter) {
            filter = MongodbSession.filter("findItem", filter);
        }
        return await this.db.collection(table).findOne(filter);
    }

    async saveItem(table: string, bean: Object) {
        return await this.db.collection(table).insertOne(bean);
    }

    async saveList(table: string, beans: Array<Object>) {
        // log.debug("保存为多个数据", beans)
        return await this.db.collection(table).insertMany(beans);
    }

    async updateItem(table: string, bean: Object, wheres: FilterQuery<any>) {
        log.debug("更新数据: ", bean);
        if (MongodbSession.filter) {
            wheres = MongodbSession.filter("updateItem", wheres);
        }
        return await this.db.collection(table).updateOne(wheres, { $set: bean });
    }

    async updateMany(table: string, bean: Object, wheres: FilterQuery<any>) {
        log.debug("更新数据: ", bean);
        if (MongodbSession.filter) {
            wheres = MongodbSession.filter("updateItem", wheres);
        }
        return await this.db.collection(table).updateMany(wheres, { $set: bean });
    }

    async deleteItem(table: string, wheres: FilterQuery<any>) {
        if (MongodbSession.filter) {
            wheres = MongodbSession.filter("deleteItem", wheres);
        }
        return await this.db.collection(table).deleteOne(wheres);
    }

    async deleteList(table: string, wheres: FilterQuery<any>) {
        log.debug("where", wheres);
        if (MongodbSession.filter) {
            wheres = MongodbSession.filter("deleteList", wheres);
        }
        return await this.db.collection(table).deleteMany(wheres);
    }

    close() {
        log.debug("关闭链接");
        if (this.client) {
            this.client.close();
        }
    }
}
