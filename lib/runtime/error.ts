`
100 Continue
101 Switching Protocols
103 Early Hints
200 OK
201 Created
202 Accepted
203 Non-Authoritative Information
204 No Content
205 Reset Content
206 Partial Content
300 Multiple Choices
301 Moved Permanently
302 Found
303 See Other
304 Not Modified
307 Temporary Redirect
308 Permanent Redirect
400 Bad Request
401 Unauthorized
402 Payment Required
403 Forbidden
404 Not Found
405 Method Not Allowed
406 Not Acceptable
407 Proxy Authentication Required
408 Request Timeout
409 Conflict
410 Gone
411 Length Required
412 Precondition Failed
413 Payload Too Large
414 URI Too Long
415 Unsupported Media Type
416 Range Not Satisfiable
417 Expectation Failed
418 I'm a teapot
422 Unprocessable Entity
425 Too Early
426 Upgrade Required
428 Precondition Required
429 Too Many Requests
431 Request Header Fields Too Large
451 Unavailable For Legal Reasons
500 Internal Server Error
501 Not Implemented
502 Bad Gateway
503 Service Unavailable
504 Gateway Timeout
505 HTTP Version Not Supported
506 Variant Also Negotiates
507 Insufficient Storage
508 Loop Detected
511 Network Authentication Required
`
export const erorrCode = {
  400: createError("400", "Bad Request", "错误请求"),
  401: createError("401", "Unauthorized", "无权限"),
  402: createError("402", "Payment Required", "Payment Required"),
  403: createError("403", "Forbidden", "Forbidden"),
  405: createError("405", "Method Not Allowed", "Method Not Allowed"),
  406: createError("406", "Not Acceptable", "Not Acceptable"),
  407: createError("407", "Proxy Authentication Required", "Proxy Authentication Required"),
  408: createError("408", "Request Timeout", "Request Timeout"),

  404: createError("404", "Not Found", "请求链接无法找到， 确保您已正确映射"),
  500: createError("500", "Internal Server Error", "程序发生错误， 请检查您的代码。"),
  501: createError("501", "Not Implemented", "Not Implemented"),
  502: createError("502", "Bad Gateway", "Bad Gateway"),
  503: createError("503", "Service Unavailable", "Service Unavailable"),
  504: createError("504", "Gateway Timeout", "Gateway Time"),
  505: createError("505", "HTTP Version Not Supported", "HTTP Version Not"),
  506: createError("506", "Variant Also Negotiates", "Variant Also Negotiates"),
  507: createError("507", "Insufficient Storage", "Insufficient Storage"),
  508: createError("508", "Loop Detected", "Loop Detected"),
  511: createError("511", "Network Authentication Required", "Network Authentication Required"),
  
  
  2000: createError("2000", "code throw Error", "code break")
   
}

export function createError(status: string, type: string, title: string, desc?: string): Object {
  return {
    status: status,
    type: type,
    title: title,
    desc: desc, 
    time: new Date()
  }
}