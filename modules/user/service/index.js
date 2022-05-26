import {
	computed,
	reactive
} from "vue";

export {account} from "../../core/ddp";
import {
	ddp,
	useMongo,
	db,
	account
} from "../../core/ddp";

export const mineInfo = reactive({})

export const Users = db.collection('users')

export const ready = computed(()=>account.state===1)

account.onChange(nv => {
	const removes =new Set( Object.keys(mineInfo))
	if (nv) {
		for (const key in nv) {
			mineInfo[key] = nv[key]
			removes.delete(key)
		}
	}
	removes.forEach(key=>delete mineInfo[key])
})


export const signin = async (data) => {
	if (!data.username || !data.password) return
	account.loginWithPassword(data.username, data.password).catch(err => {
		uni.showToast({
			title: '密码或者用户名错误'
		})
	});
};

export const signup = async (data) => {
	if (!data.username || !data.password || data.password !== data.password1) return
	account.createAccount(data.username, data.password).catch(err => {
		console.log(err)
		uni.showToast({
			title: '注册失败' + err?.reason
		})
	});
};
