<template>
	<view class="fcol cntx">
		<view class="flex-col input-list">
			<view class="list-call">
				<input v-model="data.username" type="text" maxlength="11" placeholder="请输入用户名" />
			</view>
			<view class="list-call">
				<input v-model="data.password" type="text" maxlength="32" placeholder="输入密码" password="true" />
			</view>
			<view class="list-call">
				<input v-model="data.password1" type="text" maxlength="32" placeholder="确认密码" password="true" />
			</view>
		</view>
		<view class="dlbutton" hover-class="dlbutton-hover" @tap="signup(data)">
			<text>登录</text>
		</view>
	</view>
</template>

<script setup>
import {
	reactive,
	watch
} from "vue"
import {
	signup,
	user
} from "../service";
const data = reactive({
	username: "",
	password: "",
	password1: ''
})
watch(user, (ov, nv) => {
	console.log({ ov, nv })
	if (nv?._id) {
		uni.reLaunch({
			url: '/pages/index/index'
		});
	}
}, {
	imediate: true
})
</script>

<style scoped="" lang="scss">
.content {
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.input-list {
	padding: 50upx 70upx;
}

.list-call {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	height: 100upx;
	color: #333333;
	border-bottom: 1upx solid rgba(230, 230, 230, 1);

	input {
		width: 100%;
	}
}

.dlbutton {
	color: #ffffff;
	font-size: 34upx;
	width: 470upx;
	height: 100upx;
	background: linear-gradient(
		-90deg,
		rgba(63, 205, 235, 1),
		rgba(188, 226, 158, 1)
	);
	box-shadow: 0upx 0upx 13upx 0upx rgba(164, 217, 228, 0.2);
	border-radius: 50upx;
	line-height: 100upx;
	text-align: center;
	margin-left: auto;
	margin-right: auto;
	margin-top: 100upx;
}

.dlbutton-hover {
	background: linear-gradient(
		-90deg,
		rgba(63, 205, 235, 0.9),
		rgba(188, 226, 158, 0.9)
	);
}

.addition {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	font-size: 30upx;
	margin-top: 80upx;
	color: #ffa800;
	text-align: center;
	height: 40upx;
	line-height: 40upx;
}
</style>
