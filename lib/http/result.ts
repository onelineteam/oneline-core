export class HttpResult {
    code: string = '';
    message: string = '';
    data: any = [];
    success: boolean = false;
    extra: any = null;

    static create() {
        return new HttpResult();
    }

    static toOk(options):HttpResult {
       const result: HttpResult =  HttpResult.create();
       
       result.code = options.code || 200;
       result.message =  options.message || '';
       result.data =  ((options.data === undefined)? null: options.data);
       result.success = true;
       result.extra = options.extra||null;
       
       return result;
    }


    static ok(options:any): HttpResult {
        if(typeof options == "string") {
            options = {message: options}
        }

        if(typeof options == "object" && (!options.data) && (!options.message) && (!options.extra)) {
          options = {data: options}
        }

        return this.toOk(options);
    }

    static toFail(options):HttpResult {
        const result: HttpResult =  HttpResult.create();
        result.code = options.code || 500;
        result.message =  options.message || ''; 
        return result;
    }

    static fail(options):HttpResult {
        let ops:any = {};
        if(typeof options == "string") {
          ops.message = options;
        } else {
            ops = options;
        }
        return this.toFail(ops);
    }
}