export * from './utils';
export * from './decorator';
export * from './runtime';
export * from './http';
export * from './db';
export * from './component';
export const {FastifyReply, FastifyRequest, FastifyInstance} = require('fastify');

import { app, init, initDb, filters } from './runtime';
import { IncomingMessage } from 'http';
import { WayMultipart } from './plugins';
import * as xml from 'xml-js';
import {Log, logSetting} from './utils';


///
export function start(port: number, options?: WayOptions, filtersOut?: Object[], callback?: (error: Error, address: string) => void) {

    //日志处理
    if(!Log["$log"]) {
      logSetting({showDev: false});
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
    options && options.static && app.use(options.static.prefix||'static', require("serve-static")(options.static.path))

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

    if(options && options.db) initDb(options.db);
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

