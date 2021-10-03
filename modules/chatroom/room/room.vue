<template>
	<view class="fcol">
		<view class="message-box">
			<view v-for="msg in roomMessages" :key="msg._id" class="pd">
				<view class="messgae">
					{{msg.txt}}
				</view>
			</view>
		</view>
		<view class="inputer frow cnty pd">
			<input class="f1" v-model="txt" placeholder="" />
			<button type="default" size="mini" @click="send">发送</button>
		</view>
	</view>
</template>

<script setup>
	import {
		ref
	} from "vue"
	import {
		sendMessage,
		roomMessages
	} from "../service/index"
	const txt = ref('')
	const send = () =>
		sendMessage(txt.value).then(suc => suc && txt.value === '')
</script>

<style>
	.message-box {
		height: 100%;
	}

	.inputer {
		height: 60px;
		position: fixed;
		bottom: 0;
		left: 0;
		background-color: white;
		width: 750px;
		width: 100vw;
		overflow: hidden;
	}

	input {
		border-bottom: 1px solid #BBBBBB;
		margin-right: 8px;
		padding: 5px 10px;
	}

	.messgae {
		background-color: white;
		padding: 0.5rem;
	}
</style>
