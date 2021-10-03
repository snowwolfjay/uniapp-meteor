# hj-meteor-account

## 结合hj-ddp使用

```
import { init } from "../../uni_modules/hj-ddp/js_sdk";
// 导入插件 -------------********************************************
import { hjMeteorAccount } from "../../uni_modules/hj-meteor-account/js_sdk";

// #ifdef H5
export const ddp = init('ws://localhost:3002')
// #endif

// #ifndef H5
export const ddp = init('ws://10.0.2.2:3002')
// #endif
// 使用插件 -------------********************************************
ddp.use(hjMeteorAccount)
```

## 属性 state表示插件当前状态：离线、已登录、登陆中，info是用户信息可为空，onChange里塞入一个回调函数会在用户登录登出时调用，第一个参数为user.info

```
user: {
	state: 0 | 1 | 2; // offline logined loging
	info: any;
	onChange(cb: Function): void;
};
```


## 用户注册 : u 可以是用户名或者邮箱

```
 createAccount(u: string, password: string): Promise<any>;
```

## 密码登录

```
 loginWithPassword(u: string, password: string): Promise<any>;
```

## 退出

```
logout():void
```


## 例子

```
// 一个vue3的响应式数据，vue2也支持的啦，不过下面的赋值用set 哦
export const user = reactive({})

export const Users = ddp.db.collection('users')
ddp.user.onChange((info) => {
	if (info) {
		for (const key in info) {
			user[key] = info[key]
		}
	} else {
		for (const key in user) {
			delete user[key]
		}
	}
})
// 登录
export const signin = async (data) => {
	if (!data.username || !data.password) return
	ddp.loginWithPassword(data.username, data.password).catch(err => {
		uni.showToast({
			title: '密码或者用户名错误'
		})
	});
};
// 注册
export const signup = async (data) => {
	if (!data.username || !data.password || data.password !== data.password1) return
	ddp.createAccount(data.username, data.password).catch(err => {
		uni.showToast({
			title: '注册失败'
		})
	});
};
```