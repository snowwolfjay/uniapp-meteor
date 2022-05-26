import {
	watchEffect
} from "vue";
import {
	connect
} from "../../uni_modules/hj-ddp/js_sdk";
import {
	useMeteorAccount
} from "../../uni_modules/hj-meteor-account/js_sdk";
import {
	useLocalMongo
}
from "../../uni_modules/hj-mongo-vue3/js_sdk";
export {
	useLocalMongo as useMongo
}
from "../../uni_modules/hj-mongo-vue3/js_sdk";
// #ifdef H5
export const ddp = connect('ws://localhost:3002')
// #endif

// #ifndef H5
export const ddp = connect('ws://10.0.2.2:3002')
// #endif
export const account = useMeteorAccount(ddp)

export const db = useLocalMongo("shared", ddp)

watchEffect(()=>account.data.state, (nv,ov) => {
	if (nv === 2) {
		uni.showLoading({
			title: "登陆中"
		})
	}else if(ov!==2) {
		uni.hideLoading()
	}
})
