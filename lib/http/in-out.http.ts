import { FastifyRequest, FastifyReply } from "fastify";
import { IncomingMessage, ServerResponse } from "http";
 

export class HttpRequest {
   /**
    * request为FastifyRequest<IncomingMessage>, 因为如果加入了fastify插件后, 无法获取绑定在其对象上的属性
    * @param request 
    */
   constructor(public request: any) {
    
   }

   getRequest(): any {
       return this.request;
   }
   getSession() {
       return this.request.session;
   }
}


export class HttpResponse {
    constructor(public response: FastifyReply<ServerResponse>) {
     
    }

    getResponse(): FastifyReply<ServerResponse> {
        return this.response;
    }

    redirect(url: string) {
        this.response.redirect(url);
    }

    setContentType(type: string) {
        this.response.header('Content-Type', type);
    }

    send(body: any) {
       this.response.send(body);
    }
}