# 需要注意说明

## 实体类
1. 实体类的字段， 必须初始化（否则， typescript编译后不会有字段在对象里）

## tsconfig配置里
1. target必须是es2015以上（否则， 注解出来的函数名称会丢失【匿名函数】)



## V

### 视图
@Action, @Get, @Post, ....

### 参数

@Param @Body @File

### 对象

HttpRequest, HttpResponse

### 过滤器

Filter

# M

@Id, @Unique @Validate @ForOtherObject

插入: 
1. 验证哪些字段是唯一的
2. 哪些字段是自动生成的


更新: 
1.哪些字段不需要更新
2. 哪些字段是唯一的
3. 如果是自己, 唯一字段未做更改, 则不需要进行唯一判断(通过自动生成的字段查询出数据, 进行比较)

查询:
1. 条件查询
2. 分页查询
3. 哪些字段作展示