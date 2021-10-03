<template>
	<view class="fcol">
		<view class="pd">
			<view class="mgv frow fbtw">
				<view class="f1">我的房间列表</view>
				<navigator class="fsc" url="../../modules/chatroom/create/create">
					<button type="primary" size="mini">创建</button>
				</navigator>
			</view>
			<uni-list>
				<block v-for="item in myRooms" :key="item._id">
					<uni-list-item :title="item.name" link to='/modules/chatroom/room/room' @click="goRoom(item._id)">
					</uni-list-item>
				</block>
			</uni-list>
		</view>
		<view class="pd">
			<view class="mgv">房间列表</view>
			<uni-list v-if="otherRooms.length">
				<block v-for="item in otherRooms" :key="item._id">
					<uni-list-item :clickable="true" :title="item.name" @click="joinRoom(item._id)">
					</uni-list-item>

				</block>
			</uni-list>
		</view>
	</view>
</template>

<script setup>
	import {
		myRooms,
		otherRooms,
		goRoom,
		joinRoom
	} from "../../modules/chatroom/service/index.js"
</script>

<style>

</style>
