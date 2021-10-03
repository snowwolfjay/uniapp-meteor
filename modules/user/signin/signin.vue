<template>
	<view class="fcol cntx f1">
		<view class="input-list">
			<view class="list-call">
				<input v-model="data.username" type="text" maxlength="11" placeholder="请输入用户名" />
			</view>
			<view class="list-call">
				<input v-model="data.password" type="text" maxlength="32" placeholder="输入密码" password="true" />
			</view>
		</view>
		<view class="dlbutton fsc" hover-class="dlbutton-hover" @tap="signin(data)">
			<text>登录</text>
		</view>
		<navigator url="../signup/signup" class="btn fsc mgv">
			<button  type="default">注册</button>
		</navigator>
	</view>
</template>

<script setup>
	import {
		reactive,
		watch
	} from "vue"
	import {
		signin,
		user
	} from "../service";
	const data = reactive({
		username: "",
		password: ""
	})
	watch(user, (ov, nv) => {
		console.log({ov,nv})
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
	.btn,.dlbutton{
		font-size: 34upx;
		width: 470upx;
		height: 100upx;
		border-radius: 50upx;
		line-height: 100upx;
	}
	.dlbutton {
		color: #ffffff;
		background: linear-gradient(-90deg,
				rgba(63, 205, 235, 1),
				rgba(188, 226, 158, 1));
		box-shadow: 0upx 0upx 13upx 0upx rgba(164, 217, 228, 0.2);
		text-align: center;
		margin-top: 100upx;
	}

	.dlbutton-hover {
		background: linear-gradient(-90deg,
				rgba(63, 205, 235, 0.9),
				rgba(188, 226, 158, 0.9));
	}

</style>
