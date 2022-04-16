var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __spreadValues = (a, b) => {
	for (var prop in b || (b = {}))
		if (__hasOwnProp.call(b, prop))
			__defNormalProp(a, prop, b[prop]);
	if (__getOwnPropSymbols)
		for (var prop of __getOwnPropSymbols(b)) {
			if (__propIsEnum.call(b, prop))
				__defNormalProp(a, prop, b[prop]);
		}
	return a;
};
import {
	EventEmitter,
	UniSocket,
	EJSON
} from "../../hj-core/js_sdk";

function deepCopy(d) {
	return JSON.parse(JSON.stringify(d));
}
const uuid = {
	id: 1,
	next() {
		return (this.id++).toString();
	}
};
const DDPConnectionState = {
	CLOSED: 0,
	CONNECTING: 1,
	CONNECTED: 2,
	READY: 3,
	FAIL: 4,
	CLOSING: 5,
	RECONNECTING: 6
};
const DDPConnectionEvent = {
	STATE_CHANGE: "state-change"
};
const supportedDdpVersions = ["1", "pre2", "pre1"];
class DDPConnection extends EventEmitter {
	constructor(opts) {
		super();
		this.supportedDdpVersions = supportedDdpVersions;
		this.state = DDPConnectionState.CLOSED;
		this.messages = [];
		this.checkTick = null;
		this.tlsOpts = (opts == null ? void 0 : opts.tlsOpts) || {};
		this.autoReconnect = "autoReconnect" in opts ? !!(opts == null ? void 0 : opts.autoReconnect) : true;
		this.autoReconnectTimer = (opts == null ? void 0 : opts.autoReconnectTimer) || 1e4;
		this.url = opts == null ? void 0 : opts.url;
		this.socketConstructor = opts.socketConstructor || UniSocket;
		this.ddpVersion = (opts == null ? void 0 : opts.ddpVersion) || "1";
		this._callbacks = {};
		this._updatedCallbacks = {};
		this._pendingMethods = {};
		this.on("connected", () => {
			this._clearReconnectTimeout();
			this.changeState(DDPConnectionState.READY);
			this.checkMessage();
		});
		this.on("failed", (error) => {
			this.changeState(DDPConnectionState.FAIL, error);
		});
		if ("autoConnect" in opts ? opts.autoConnect : true) {
			this.connect();
		}
	}
	get isSocketBusy() {
		return this.state === DDPConnectionState.CLOSING || this.state === DDPConnectionState.CONNECTING || this
			.state === DDPConnectionState.RECONNECTING;
	}
	changeState(state, data) {
		this.state = state;
		this.emit(DDPConnectionEvent.STATE_CHANGE, {
			state,
			data
		});
	}
	connect(url, protos, data) {
		if (this.state !== DDPConnectionState.CLOSED && this.state !== DDPConnectionState.RECONNECTING) {
			return;
		}
		this.changeState(DDPConnectionState.CONNECTING);
		this.url = this.parseUrl(url || this.url);
		this.socket = new this.socketConstructor(this.url + "/websocket", protos, data);
		this._prepareHandlers();
	}
	parseUrl(url = "") {
		if (url.endsWith("/"))
			url = url.slice(0, -1);
		if (url.endsWith("/websocket"))
			url = url.slice(0, -10);
		return url;
	}
	_prepareHandlers() {
		const socket = this.socket;
		socket.onopen = () => {
			this.changeState(DDPConnectionState.CONNECTED);
			this.send({
				msg: "connect",
				version: this.ddpVersion,
				support: this.supportedDdpVersions
			}, true);
		};
		socket.onerror = (error) => {
			if (this.state === DDPConnectionState.CONNECTING) {
				this.emit("failed", error.message);
				this.changeState(DDPConnectionState.FAIL);
			}
			this.emit("socket-error", error);
		};
		socket.onclose = (ev) => {
			this.changeState(DDPConnectionState.CLOSED, ev);
			if (this.state === DDPConnectionState.CONNECTED) {
				this.emit("socket-close", ev == null ? void 0 : ev.code, ev == null ? void 0 : ev.reason);
				this._endPendingMethodCalls();
			}
			this.reconnect();
		};
		socket.onmessage = (event) => {
			this.ddpMessageHandler(event.data);
			this.emit("message", event.data);
		};
	}
	close() {
		this.changeState(DDPConnectionState.CLOSING);
		this.socket.close();
	}
	call(name, params, callback, updatedCallback, options = {}) {
		var id = this._getNextId();
		let timer;
		if (options.timeout) timer = setTimeout(() => {
			this.revokeCallBack(id, 'TIMEOUT')
		}, options.timeout);
		if (typeof callback === "function") {
			this._pendingMethods[id] = true;
			this._callbacks[id] = (...args) => {
				delete this._callbacks[id]
				delete this._pendingMethods[id];
				if (callback) {
					callback.apply(this, args);
				}
				timer && clearTimeout(timer)
			};
		}
		if (typeof updatedCallback === "function") {
			this._pendingMethods[id] = true;
			const callback = this._updatedCallbacks[id]
			this._updatedCallbacks[id] = (...args) => {
				delete this._pendingMethods[id];
				delete this._updatedCallbacks[id]
				if (callback) {
					callback.apply(this, args);
				}
				timer && clearTimeout(timer)
			};
		}
		this.send({
			msg: "method",
			id,
			method: name,
			params
		});
	}
	callWithRandomSeed(method, params, randomSeed, callback, updatedCallback) {
		var id = this._getNextId();
		if (callback) {
			this._callbacks[id] = callback;
		}
		if (updatedCallback) {
			this._updatedCallbacks[id] = updatedCallback;
		}
		this.send({
			msg: "method",
			id,
			method,
			randomSeed,
			params
		});
	}
	subscribe(name, params, callback) {
		const id = uuid.next();
		const data = {
			msg: "sub",
			id,
			name,
			params
		};
		if (typeof callback === "function")
			this._callbacks[id] = (err) => {
				callback(err, !err ? {
					id,
					name,
					params,
					stop: () => this.unsubscribe(id)
				} : undefined);
			};
		this.send(data);
		return id;
	}
	unsubscribe(id) {
		this.send({
			msg: "unsub",
			id
		});
	}
	_clearReconnectTimeout() {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
	}
	reconnect() {
		if (!this.autoReconnect || this.isSocketBusy)
			return;
		this._clearReconnectTimeout();
		this.reconnectTimeout = setTimeout(() => {
			this.connect();
		}, this.autoReconnectTimer);
		this.changeState(DDPConnectionState.RECONNECTING);
	}
	send(data, force = false) {
		if (force) {
			if (this.state === DDPConnectionState.CONNECTED)
				this.socket.send(EJSON.stringify(data));
			else
				this.messages.unshift(data);
			return;
		}
		if (data.id) {
			const oldIndex = this.messages.findIndex((el) => {
				return el.method && el.method === data.method && JSON.stringify(el.params) === JSON
					.stringify(data.params);
			});
			if (oldIndex > -1) {
				const oo = this.messages.splice(oldIndex, 1)[0];
				this.revokeCallBack(oo.id, [1, "ignored"]);
			}
		}
		this.messages.push(data);
		this.checkMessage();
	}
	checkMessage() {
		if (this.state !== DDPConnectionState.READY || this.messages.length === 0)
			return;
		clearTimeout(this.checkTick);
		this.socket.send(JSON.stringify(this.messages.shift()));
		this.checkTick = setTimeout(() => {
			this.checkMessage();
		}, 0);
	}
	ddpMessageHandler(data) {
		data = EJSON.parse(data);
		const type = data == null ? void 0 : data.msg;
		this.emit('ddp-message', data)
		switch (type) {
			case "failed": {
				if (this.supportedDdpVersions.indexOf(data.version) !== -1) {
					this.ddpVersion = data.version;
					this.connect();
				} else {
					this.autoReconnect = false;
					this.emit("failed", "Cannot negotiate DDP version");
				}
				break;
			}
			case "connected": {
				this.session = data.session;
				this.emit("connected");
				break;
			}
			case "result": {
				this.revokeCallBack(data.id, data.error, data.result);
				break;
			}
			case "updated": {
				Array.from(data.methods).forEach((method) => {
					var cb = this._updatedCallbacks[method];
					if (cb) {
						cb();
						delete this._updatedCallbacks[method];
					}
				});
				break;
			}
			case "nosub": {
				this.revokeCallBack(data.id, data.error);
				break;
			}
			case "ready": {
				Array.from(data.subs).forEach((id) => {
					this.revokeCallBack(id);
				});
				break;
			}
			case "ping": {
				this.send(Object.prototype.hasOwnProperty.call(data, "id") ? {
					msg: "pong",
					id: data.id
				} : {
					msg: "pong"
				});
			}
		}
	}
	_getNextId() {
		return uuid.next();
	}
	_endPendingMethodCalls() {
		var ids = Object.keys(this._pendingMethods);
		this._pendingMethods = {};
		ids.forEach((id) => {
			if (this._callbacks[id]) {
				this._callbacks[id]('DISCONNECTED');
				delete this._callbacks[id];
			}
			if (this._updatedCallbacks[id]) {
				this._updatedCallbacks[id]();
				delete this._updatedCallbacks[id];
			}
		});
	}
	revokeCallBack(id, ...args) {
		const cb = this._callbacks[id];
		typeof cb === "function" && cb(...args);
		delete this._callbacks[id];
	}
}
var IDDPConnectionState;
(function (IDDPConnectionState2) {
	IDDPConnectionState2[IDDPConnectionState2["CLOSED"] = 0] = "CLOSED";
	IDDPConnectionState2[IDDPConnectionState2["CONNECTING"] = 1] = "CONNECTING";
	IDDPConnectionState2[IDDPConnectionState2["CONNECTED"] = 2] = "CONNECTED";
	IDDPConnectionState2[IDDPConnectionState2["READY"] = 3] = "READY";
	IDDPConnectionState2[IDDPConnectionState2["FAIL"] = 4] = "FAIL";
	IDDPConnectionState2[IDDPConnectionState2["CLOSING"] = 5] = "CLOSING";
	IDDPConnectionState2[IDDPConnectionState2["RECONNECTING"] = 6] = "RECONNECTING";
})(IDDPConnectionState || (IDDPConnectionState = {}));
class Client {
	constructor({
		url = "ws://localhost:3000/websocket"
	}) {
		this.plugins = {};
		if (Client.clients.has(url))
			return Client.clients.get(url);
		Client.clients.set(url, this);
		this.connection = new DDPConnection({
			url
		});
		this.on = this.connection.on.bind(this.connection)
		this.isReady = () => new Promise(resolve => {
			if (this.connection.state === DDPConnectionState.CONNECTED) {
				return resolve()
			}
			const cb = ({ state }) => {
				if (state === DDPConnectionState.CONNECTED) {
					this.connection.off(DDPConnectionEvent.STATE_CHANGE, cb)
					resolve()
				}
			}
			this.connection.on(DDPConnectionEvent.STATE_CHANGE, cb)
		})
		this.isClose = () => new Promise(resolve => {
			if (this.connection.state !== DDPConnectionState.CONNECTED) {
				return resolve()
			}
			const cb = ({ state }) => {
				if (state !== DDPConnectionState.CONNECTED) {
					this.connection.off(DDPConnectionEvent.STATE_CHANGE, cb)
					resolve()
				}
			}
			this.connection.on(DDPConnectionEvent.STATE_CHANGE, cb)
		})
		const onReadys = new Set()
		const onCloses = new Set()
		this.onReady = cb => {
			if (typeof cb !== "function") return console.warn(`must be function onReady`)
			if (this.connection.state === DDPConnectionState.CONNECTED) cb()
			onReadys.add(cb)
			return () => onReadys.delete(cb)
		}
		this.onClose = cb => {
			if (typeof cb !== "function") return console.warn(`must be function onClose`)
			if (this.connection.state !== DDPConnectionState.CONNECTED) cb()
			onCloses.add(cb)
			return () => onCloses.delete(cb)
		}
		let connected = false;
		this.connection.on(DDPConnectionEvent.STATE_CHANGE, ({ state }) => {
			const newState = state === DDPConnectionState.CONNECTED;
			if (newState === connected) return;
			connected = newState;
			(connected ? onReadys : onCloses).forEach(el => el());
		})
	}
	call(name, ...args) {
		const callArgs = args.filter((el) => typeof el !== "function");
		const callback = args.filter((el) => typeof el === "function");
		return this.connection.call(name, callArgs, callback[0], callback[1]);
	}
	subscribe(name, ...args) {
		const callArgs = args.filter((el) => typeof el !== "function");
		const callback = args.filter((el) => typeof el === "function");
		return this.connection.subscribe(name, callArgs, callback[0]);
	}
	unsubscribe(id) {
		this.connection.unsubscribe(id);
	}
	destroy() {
		this.connection.close();
	}
};
Client.clients = new Map();
const buildedClients = new Map();

function connect(opt) {
	if (!opt)
		opt = "ws://localhost:3000/websocket";
	const userOpt = typeof opt === "string" ? {
		url: opt
	} : opt;
	if (buildedClients.has(userOpt.url))
		return buildedClients.get(userOpt.url);
	return Object.freeze(new Client(__spreadValues({
		socketConstructor: UniSocket
	}, userOpt)));
}
export {
	IDDPConnectionState,
	connect
};
