
【server端包括import 90行ts代码，前端代码量也是极少主要在ui，虽然比较粗糙】
## 虽然前些年提议让dcloud做云函数，于是unicloud如火如荼，但这种一问一答的机械方式始终不是未来
## 然而firebase等依旧被墙，所以抽时间做了这么个东西自己用吧，也分享给需要的人
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