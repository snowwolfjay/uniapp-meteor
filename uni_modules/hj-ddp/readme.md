# hj-ddp

## 一个Uniapp的DDP实现，助你成为全栈工程师

>DDP是什么
>>DDP是一个 分布式数据协议，主要是为了解决不同终端数据同步的问题，使用简单的协议来实现多个终端的数据一致性。由Meteor提出和维护。Vue创造者当时就是从Meteor离职然后全职维护vue的。

>它有什么好处
>>DDP是一个异步的数据推送，而且做到订阅了的数据会直接推送，所以：
>>>小明改了个自己的昵称、另一个人会很快看到改动；

>>>订单状态变了，所在的列表会自动刷新，而不需要进行一次请求

>它的原理和不足、使用建议
>>【推荐使用Meteor作为服务端，参考demo】 基于Mongodb以及订阅发布模式，在ddp服务器端自定义个发布源：可以参考MongoDB的watch API或者冒出来的大量livequery服务（它们都收费的)，如果改动的数据集满足定义的选择器（例如{age:{$gt:30}这种选择30岁以上的}，就会把这个改动推送给所有的订阅者

>>基于Websocket实现双工通讯，因为要维护连接，所以可能更耗资源？但有点不能认同，因为websocket建立起来后就不需要多次握手，以及重复的身份验证

>>>1.高频更新的数据很合适！
>>>2.大文件(100k)和长音频等媒体文件，别用！
>>>3.静态资源文件,别用!

## 使用指南 -【typescript】

### 1. 建立连接 - 确保安装了hj-core

```
import { connect, IDDPClient } from "../../uni_modules/hj-ddp/js_sdk"
// ts
export const ddp: IDDPClient = connect("ws://localhost:3002");
// js
export const ddp = connect("ws://localhost:3002");
```

####1. init :  参数 string | undefined | IDDPClientOption

```
interface IDDPClientOption {
  socketConstructor?: Socket;
  tlsOpts?: any;
  autoReconnect?: boolean;
  autoReconnectTimer?: number;
  url?: string;
  ddpVersion?: string;
}
```

>>说明： 缺省值为ws://localhost:3000 - meteor默认地址，Mongodb为meteor端口+1或者自己传入 ；同一个ddp服务地址只会建立一个客户端
>>>IDDPClientOption.socketConstructor: 自定义的socket构造函数，已经封装了个uniapp的，所以不需要传入，自己可以封装个http的只要实现Socket的方法即可

>>>IDDPClientOption.tlsOpts: 暂时没用到，后面可能作为连接参数

>>>IDDPClientOption.autoReconnect: 自动重连-默认true

>>>IDDPClientOption.autoReconnectTimer: 自动重连间隔-默认10000ms = 10s

>>>IDDPClientOption.url: ddp服务地址，同字符串方式的

>>>IDDPClientOption.ddpVersion: ddp协议版本，默认 1，当前版本，协议挺稳定，基本没改过

>>返回：IDDPClient

### 2. IDDPClient说明 - 简单的看接口定义

```
interface IDDPClient {
  call(name: string, arg?: any, ready?: Function, updated?: Function): void;
  subscribe(name: string, arg?: any, ready?: Function): string;
  unsubscribe(id: string): void;
  destroy(): void;
}
```

> 1. call: 调用远程定义的方法，只支持一个参数传送给远端*，ready回调会传入远程方法的返回值，updated会在call方法修改了文档+订阅了这个文档，且本地更新完后调用 - （例如你新增一个订单，成功后会返回订单id，但不一定已经入库了，updated会晚一点执行，但是如果一个方法修改了文档然后做了些其它耗时的操作updated会早于ready)

> 2. subscribe: 订阅一个发布源，可以传入一个参数，ready方法在订阅源的所有文档都在本地后调用

> 3. unsubscribe: 将subscribe返回的id传入即可取消订阅，订阅相关的数据会被清除~










