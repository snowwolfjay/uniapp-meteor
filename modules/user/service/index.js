
import {
	reactive
} from "vue";

import {
	ddp
} from "../../core/ddp";

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

export const signin = async (data) => {
	if (!data.username || !data.password) return
	ddp.loginWithPassword(data.username, data.password).catch(err => {
		uni.showToast({
			title: '密码或者用户名错误'
		})
	});
};

export const signup = async (data) => {
	if (!data.username || !data.password || data.password !== data.password1) return
	ddp.createAccount(data.username, data.password).catch(err => {
		uni.showToast({
			title: '注册失败'
		})
	});
};