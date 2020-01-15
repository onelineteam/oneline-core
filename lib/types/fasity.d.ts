import { Http2ServerRequest, Http2ServerResponse } from "http2";
import { IncomingMessage, ServerResponse } from "http";
type HttpRequest = IncomingMessage | Http2ServerRequest;
type HttpResponse = ServerResponse | Http2ServerResponse;
declare namespace fastify {
   
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
}


declare module 'fastify' {
  interface FastifyRequest<HttpRequest> {
    session: any;
  }
}