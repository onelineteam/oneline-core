import { IncomingMessage, ServerResponse } from "http";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ComponentBean } from "../component";

export abstract class HttpFilter {
  abstract chain(app:FastifyInstance, request: FastifyRequest<IncomingMessage>, response: FastifyReply<ServerResponse>, key?: String, bean?: ComponentBean):Promise<{success: boolean, message: string, break?:boolean, code?:string}>;
}


