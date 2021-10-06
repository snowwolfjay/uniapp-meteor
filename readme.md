## 技术构成:

> 1 前端使用uniapp便于快速的多端开发，项目结构采用模块化结构，除了入口级页面、基于功能将代码和资源组合在不同的功能目录
> 
> 2 后端使用meteor实现ddp服务器（[轻量极简的ddp协议](https://github.com/meteor/meteor/blob/devel/packages/ddp/DDP.md)），meteor基于nodejs，自带一个mongodb，通过配置MONGO_URL参数可以取消启动默认的db
>
> 3 前后端通讯使用websocket（也可以用http轮询模拟）实现数据的同步和方法的异步调用
>
> 4 数据的前端相应基于vue提供的响应式数据操作，通过订阅ddp服务器发布的数据实现即时的数据更新至本地的数据集（简版的minimongo）
>
> 5 服务端的数据响应，基于mongodb提供的aggregate watch api,也就是提供一个查询条件，如果操作的数据满足这个条件就会通知各个连接的订阅者，极大简化了不同连接的数据同步
【server端包括import 90行ts代码，前端代码量也是极少主要在ui，虽然比较粗糙】
#### 虽然前些年提议让dcloud做云函数，于是unicloud如火如荼，但这种一问一答的机械方式始终不是未来
#### 然而firebase等依旧被墙，所以抽时间做了这么个东西自己用吧，也分享给需要的人
## server端目前使用meteor的ddp实现
```
// 初次使用安装依赖 - 仅需第一次 - 自带了mongodb服务器所以比较大，也可以试着找找其它的ddp实现或者自己实现server？
npm install meteor -g
cd meteor
npm install
// 以后只需要在meteor目录下，打开命令行或者ps 用一下指令即可，或者参考meteor官方文档改服务器配置等等
npm run start
```

## 已经开源在 [codechina 源码](https://codechina.csdn.net/weixin_42500182/dpp-demo)


```
目录结构：
/modules/ddp.js  导出共享的ddp客户端
/modules/user    用户模块相关服务和页面
/modules/chatroom 聊天室相关服务和页面
/pages/index/index 主页
```

## app调试，安装hbuildx，然后点击运行到设备即可 --- 记得按照上面的步骤启动meteor ddp服务应用

## web调试预览，安装hbuildx，然后点击运行到浏览器即可 --- 记得启动meteor ddp服务应用