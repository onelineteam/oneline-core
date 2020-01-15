/**
 * @file 该文件主要解决了fastify-multipart设置addToBody后, 其他内容格式类型的请求无法使用的问题
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { IncomingMessage, ServerResponse } from "http";
import * as fp from 'fastify-plugin';
import * as fpmultipart from 'fastify-multipart';


function attachToBody(options, req, reply, next) {

  const consumerStream = options.onFile || defaultConsumer
  const body = {}
  const mp = req.multipart((field, file, filename, encoding, mimetype) => {

    log.debug("----------------------------->", field, file, filename, encoding, mimetype);
    body[field] = {
      data: [],
      filename,
      encoding,
      mimetype,
      limit: false
    }

    const result = consumerStream(field, file, filename, encoding, mimetype, body)

    log.debug("==================>", result);
    if (result && typeof result.then === 'function') {
      result.catch((err) => {
        // continue with the workflow
        log.debug("throw erro with 500", err)
        err.statusCode = 500
        file.destroy(err)
      })
    }
  }, function (err) {
    log.debug("parse program: ===============> ", err)
    if (!err) {
      req.body = body
    }
    next(err)
  }, options)

  mp.on('field', (key, value) => {
    body[key] = value
  })
}

function defaultConsumer(field, file, filename, encoding, mimetype, body) {

  log.debug("file=======================>", file)
  const fileData = []
  file.on('data', data => { fileData.push(data) })
  file.on('limit', () => {
    log.debug("----------------------------limit------")
    body[field].limit = true
  })
  file.on('end', () => {
    log.debug(">>>>>>>>>>>>>>>>>>>>>data:", fileData.length)
    body[field].data = Buffer.concat(fileData)
  })

  file.on('error', (err) => {
    log.debug("error=================>", err)
  })

  file.on('finish', () => {
    log.debug("finish==================>")
  })

  file.on('close', () => {
    log.debug("close =====================>")
  })


}




function multipartPlugin(fastify: FastifyInstance, options: any, done) {
  if (options.addToBody) {
    delete options.addToBody;
  }
  fastify.register(fpmultipart, options);
  fastify.addHook('preValidation', function (req: FastifyRequest<IncomingMessage>, reply: FastifyReply<ServerResponse>, next) {
    log.debug("now is mult judge:  ", req.isMultipart())
    if (req.isMultipart()) {
      attachToBody(options, req, reply, next);
    } else {
      next();

    }

  })

  done();
}

export const WayMultipart = fp(multipartPlugin, { name: 'way-multipart' })