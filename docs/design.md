# 工作原理说明

![工作原理](https://raw.githubusercontent.com/hughfenghen/ts-rpc/master/rpc-desc.png)  

## Server

1. ts-brpc命令根据 json 配置，扫描对应目录的源文件  
2. 找到（RPCService、RPCMethod）标识的 class、method，写入`_rpc_gen_meta_.json`  
3. http 服务启动时，注入中间件（bindKoa、bindMidway）  
4. 中间件加载 **_rpc_gen_meta_.json**, 同时处理符合条件的 client 请求  
5. 根据请求 的url path 匹配，若匹配成功则执行 server 中对应class 的 method  
6. 获取返回值后，写入 http body  

## Client

1. ts-brpc命令根据 json 配置，从 server 端同步扫描结果（_rpc_gen_meta_.json）  
2. 生成rpc-definition.ts，借助编辑器提供接口文档、类型校验、参数提示  
3. client 接口调用会被 agent 转换成 http 请求，发送给 server 端  
4. 从 server 端获取到请求后，解析返回值，返回给调用方  
