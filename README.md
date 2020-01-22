# oneline-core

一个快速开发web系统的框架. 我们使用的是typescript来完成开发.

>目前框架源码与实际项目还在分离中， 目前使用的版本， 有问题或者建议，欢迎大家在issues中提。


## install

```javascript
   npm install @oneline/core;
   //or
   yarn add @oneline/core;
```

也可以通过[@oneline/cli](https://github.com/keep2zero/oneline-cli) 来快速创建基于@oneline/core的项目结构.

```javascript

  npm install @oneline/cli -g;
  
  //然后来创建项目
  oneline -c oneline-demo //online-demo为示例名称,大家可以自行修改

```


## 快速指南

`视频教程地址： `[http://v.qq.com/vplus/962b27e96a60d6a4d198c58fb86eb4dc?page=cover](http://v.qq.com/vplus/962b27e96a60d6a4d198c58fb86eb4dc?page=cover)

1.首先我们创建一个control: `index.ts`
目前我们默认是`application/json`的响应数据.

```javascript
  import {Get, HttpResult} from '@oneline/core';
  
  class Index {

    @Get("/index", "首页")
    public index() {
      return HttpResult.ok({message: '返回成功', data: []})
    }

  }
```

2.创建项目启动入口: `app.ts`

```javascript
  import {start} from '@oneline/core';
  import './index';


  start(3000);
```

3.启动

```sh
  node app.js
```

## 接口说明

### start

```javascript
 const app = start(port: number, options: WayOptions, filters: HttpFilter[], callback: Function);
```

**app** 为fastify实例对象. 可以根据[fastify](https://www.fastify.io/)功能,增加相关功能

#### WayOptions

这个类型包含: `db`, `cors`, `static` 字段.

`db`是数据库配置对象. 数据库字段包含:

```javascript
{
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}
```

**host**: 服务器地址

**port**: 数据库端口

**username**: 用户名

**password**: 密码

**database**: 数据库名称

> 数据库目前只支持mongodb.

`cors` 跨域配置. 主要字段如下:

```javascript
{
  origin?: string|string[]|Boolean|Function;
  methods?: string|string[];
  allowedHeaders?: string|string[];
  exposedHeaders?: string|string[];
  preflight?:Boolean,
  credentials?: Boolean
}
```

字段都是可选. 每个字段的作用可查看[MDN文档](https://developer.mozilla.org/en-US/docs/Glossary/CORS)

`static`: 配置静态文件路径. 配置静态文件读取的路径及请求前缀.

```javascript
{prefix: string, path: string}
```

**prefix** 为请求前缀, 默认为**static**. 这里不需要加入斜杆(**/**)作为起始.

**path** 为静态文件的目录.


#### HttpFilter

```javascript
abstract class HttpFilter {
  abstract chain(app:FastifyInstance, request: FastifyRequest<IncomingMessage>, response: FastifyReply<ServerResponse>, key?: String, bean?: ComponentBean):Promise<{success: boolean, message: string, break?:boolean, code?:string}>;
}
```

`HttpFilter`为过滤器, 它是一个抽象类, 需要实现这个类. 这里可以根据自己的需求来加入系统的过滤器.


`callback` 为一个回调函数. 启动完成后,会执行该函数.

## 请求注解功能

### @Action

```javascript
  Action(options: ComponentActionOptions)
```

`ComponentActionOptions` 类型主要有以下字段:

```javascript
  path: string; //View中的请求路径 必要
  method: any; // 请求方法 必要
  paramtypes?: Array<any>; //参数类型数据
  paramNames?: Array<string>;//参数名称
  params?: object;
  actionName?: string;
  marker?:boolean;
  response?: HttpResponseHeader;
```

> `以下是Action的简便方法`.

### @Get

```javascript
  Get(path: string | ComponentActionOptions, actionName?: string, marker:boolean = false)
```

**path** :当为string时, 这个为路由路径. 如果是ComponentActionOptions对象时, 同上.

**actionName**: 函数的功能说明.

**marker**: `true` 作为编组的标记, 否则是函数功能

### @Post

同上

### @OPTIONS

同上

### @Delete

同上

## 参数注解

### @Param

参数匹配映射. 这里包含了, 请求链接参数和实体类内容. 都可以用Param来映射到函数参数中.

```javascript
  //请求: http://api.weixin.qq.com/sns/login?type=wechat
  public login(@Param('type') type: string) {
    console.log(type); // 输出wechat
  }

  //或者
  public login(@Param('type') loginType: string) {
    console.log(loginType); //输出wechat
  }
```

### @Body({rule: object, query: object})

实体类映射. 主要用于实体类的在插入到数据库之前,做限制规则.

`rule` 为校验规则的对象. 主要是post请求中的实体数据.  

`query` 为请求链接中的参数.

#### 验证实体类

**regx**: 正则表达式. regx的优先级最高, 如果regx设置, 则email, required等默认的格式验证, 则被忽略.

**readonly**: 只读设定. 默认自动生成. 也可以指定`value:(():any)`来自己实现.

**required**: 不能为空验证. 如果需要检测是否在数据库存在, 加入`connect: {dao: Dao, method: string, key: string}`


**email**: 邮箱验证

**unique**: 唯一验证. 需要对比数据库的数据情况. `{dao: Dao, method: string, key: string, self: boolean}`. 如果self为true, 则代表更新状态.则不需要与自己作对比.


#### 例子

```javascript

 class SignUser {
   uid: string = "";
   username: string  = "";
   password: string = "";
   createTime: number = Date.now();
   from: string = "";
 }

 const SignRule = {
   signup: {
     uid: {
       label: "用户ID",
       rules: [
         {readonly: true}
       ]
     },
     username: {
       label: "用户名",
       type: String,
       rules: [
         {required: true, message: '请输入用户名'}
       ]
     },
     password: {
       label: "密码",
       type: String,
       rules: [
         {regx: /\w{6, 8}/, message: "密码必须是6~8个字符"}
       ]
     },

     from: {
       label: '来自',
       type: String,
       rules: [
         {required:true}
       ]
     }
   }
 }

 // 设置from, 来自url中. http://localhost:3000/signup?platform=app
 class SignMarker {

   @Post("/signup", "注册")
   signup(@Body({rule: SignRule.signup, query: {platform: 'from'}}) user: SignUser) {
     return HttpResult.ok({message: '注册成功'});
   }

 }

```

如果不满足条件, 则会报错! 不会执行函数体, 不会返回注册成功.

## 属性注解

### @Property

属性注解用于自动注入对象, 不用自己手动创建对象.

```javascript
   class Test {
     public todo() {
       console.log("todo...")
     }
   }

   class TestIndex {
      @Property() test: Test;
      public index() {
         this.test.todo();
      }

   }

```

## mongo数据库操作

数据库操作, 我们需要在启动的时候, 配置数据库的链接

```javascript
  star(3000, {
    db: {
      host: '127.0.0.1',
      port: 3690,
      database: 'oneline',
      username: 'root'
      password: '123456'
    }
  })
```

在操作方面, 我们内置了一个service层和数据库(Dao)操作层.

### service

`DefaultService<T>` 这是一个抽象类, 实现了接口`Service<T>`. 我们也可以实现`Service<T>`接口, 和继承`DefaultService<T>`使用现有的操作数据库的方法. 

### dao

`DefaultDao<T>` 这是一个抽象类, 实现了接口`Dao<T>`. 我们也可以实现`Dao<T>`接口, 和继承`DefaultDao<T>`使用现有的操作数据库的方法.

### 例子

```javascript
  
  public class User {
    uid: string = "";
    uname: string = "";
    upass: string = "";
    createTime: number = Date.now();
  }


  public class UserDao extends DefaultDao<User> {
    table: string = "ol-user";
  }


  public class UserService extends DefaultService<User> {
    @Property() dao: UserDao<User>;
  }


  public class UserAction {
    @Property() service: UserService;

    @Post("/user/signup")
    public async signup(@Body() user:User) {
      await this.service.save(user);
      return HttResult.ok({message: "注册成功"});
    }
  }


```

## 文档还在继续完善
