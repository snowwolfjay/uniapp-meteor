import {
	useMongo,
	ddp
} from "../../core/ddp.js"
import {
	mineInfo
} from "../../user/service/index.js"
import {
	reactive,
	computed,
	watchEffect
} from "vue"
ddp.subscribe("rooms.all")
ddp.subscribe("rooms.mine")
const db = useMongo(mineInfo._id, ddp)
const AllRooms = db.collection('rooms')
const Messages = db.collection('messages')
let currentRoom = null;
console.log(mineInfo._id)
export const myRooms = AllRooms.liveQuery({
	createdBy: mineInfo._id
})
export const roomMessages = reactive([])
export const otherRooms = AllRooms.liveQuery({
	createdBy: {
		$ne: mineInfo._id
	}
})
watchEffect(() => {
	console.log(myRooms)
	console.log(otherRooms)
})
export const sendMessage = async txt => {
	if (!currentRoom || !txt) return
	const data = {
		roomId: currentRoom,
		txt,
		_id: mineInfo._id + "-" + Date.now()
	}
	const res = await Messages.insert({
		...data
	}, {
		remote: 1
	})
	console.log(res)
}
export const createRoom = name => new Promise(resolve => {
	{
		ddp.call('room.create', name, (err, res) => {
			err && resolve(false)
		}, () => {
			uni.navigateBack({
				delta: 1
			})
			resolve(true)
		})
	}
})
export const goRoom = id => {
	if (id === currentRoom) return
	currentRoom = id;
	roomMessages.splice(0)
	console.log(Messages.find({
		roomId: id
	}))
	roomMessages.push(...Messages.find({
		roomId: id
	}))
}
Messages.observe({
	added(id, v) {
		if (v.roomId !== currentRoom) return
		roomMessages.push(v)
	},
	removed(id) {
		const index = roomMessages.findIndex(e => e._id === id)
		index > -1 && roomMessages.splice(i, 1)
	},
	changed(id, v) {
		if (v.roomId !== currentRoom) return
		const index = roomMessages.findIndex(e => e._id === id)
		index > -1 && roomMessages.splice(i, 1, nv)
	}
});

export const joinRoom = id => new Promise(resolve => {
	if (!mineInfo._id) return uni.navigateTo({
		url: '/modules/user/signin/signin'
	})
	ddp.call('room.join', id, (err, res) => {
		err && resolve(false)
	}, () => {
		resolve(true)
	})
})
