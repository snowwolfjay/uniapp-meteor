import {
	ddp
} from "../../core/ddp.js"
import {
	reactive,
	computed
} from "vue"
export const myRooms = reactive([])
const allRooms = reactive([])
console.log(ddp)
const MyRooms = ddp.db.collection('rooms-mine')
const AllRooms = ddp.db.collection('rooms')
const Messages = ddp.db.collection('messages')
let currentRoom = null;
ddp.map(MyRooms, myRooms)
ddp.map(AllRooms, allRooms)

export const roomMessages = reactive([])
export const otherRooms = computed(() => allRooms.filter(v => !myRooms.some(e => e._id === v._id)))
export const sendMessage = txt => new Promise(resolve => {
	if (!currentRoom || !txt) return resolve(false)
	const data = {
		roomId: currentRoom,
		txt,
		_id: Date.now()
	}
	ddp.call('message.add', {
		...data,
		_id: undefined
	}, (err, res) => {
		resolve(!err)
	})
})
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
import {
	user
} from "../../user/service"
export const joinRoom = id => new Promise(resolve => {
	if (!user._id) return uni.navigateTo({
		url: '/modules/user/signin/signin'
	})
	ddp.call('room.join', id, (err, res) => {
		err && resolve(false)
	}, () => {
		resolve(true)
	})
})
