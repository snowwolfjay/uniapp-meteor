<template>
	<view class="fcol cntx f1">
		<view class="input-list">
			<view class="list-call">
				<input v-model="name" type="text" maxlength="11" placeholder="房间名称" />
			</view>
		</view>
		<button class="dlbutton fsc" hover-class="dlbutton-hover" @tap="createRoom(name)">
			<text>创建</text>
		</button>
	</view>
</template>

<script setup>
	import {
		ref
	} from "vue"
	import {
		createRoom
	} from "../service";
	const name = ref('')
</script>

<style scoped="" lang="scss">

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
		background: linear-gradient(-90deg,
				rgba(63, 205, 235, 1),
				rgba(188, 226, 158, 1));
		box-shadow: 0upx 0upx 13upx 0upx rgba(164, 217, 228, 0.2);
		text-align: center;
		margin-top: 100upx;
	}

</style>
