import {
	UniDB,
	hashString,
	SHA256
} from "../../hj-core/js_sdk";
import {
	reactive
} from "vue"
export function useMeteorAccount(client, opts) {
	const cacher = opts?.cacher || new UniDB("hj-meteor-user");
	const debug = !!opts?.debug;
	const od = cacher.get("login");
	const ucs = new Set();
	const data = reactive({
		state: 2,
		user: null
	})
	client.on("ddp-message", d => {
		if (!d || typeof d !== "object" || d.collection !== "users") return
		const {
			msg,
			id,
			fields = {},
			cleared = []
		} = d;
		if (msg === "added") {
			if ((!data.user || data.user._id === id)) {
				data.user = {
					_id: id,
					...fields
				}
			}
		} else if (msg === "changed") {
			if (data.user && id === data.user._id) {
				for (const key in fields) {
					data.user[key] = fields[key]
				}
				for (const key of cleared) {
					delete data.user[key]
				}
			}
		} else if (msg === "removed") {
			if (data.user && id === data.user._id)
				data.user = null
		}
	})

	function notify() {
		if (debug) {
			console.log('account change')
			console.log(data)
		}
		ucs.forEach(cb => cb(data.user))
	}
	if (od) {
		if (new Date(od.tokenExpires).getTime() > Date.now()) {
			//   relogin
			console.info("resume login start")
			data.user = {
				_id: od.id
			}
			client.onReady(() => {
				client.call("login", {
					resume: od.token
				}, (err, result) => {
					console.info(err, result)
					if (err) {
						data.state = 0;
						cacher.set("login", "");
						data.user = null;
					} else {
						data.state = 1;
						cacher.set("login", result);
					}
					notify();
				});
			});
		} else {
			data.state = 0
			cacher.set("login", "");
			console.log(`clear login cache`)
		}
	} else {
		data.state = 0
		console.log(`no login tracked`)
	}
	const exports = {
		data,
		client,
		options: opts,
		onChange(cb) {
			ucs.add(cb)
			return () => ucs.delete(cb)
		}
	}
	const hashPassword = password => ({
		digest: SHA256(password),
		algorithm: "sha-256"
	})
	exports.loginWithPassword = (selector, password) =>
		new Promise((resolve, reject) => {
			const request = {};
			data.state = 2;
			if (typeof selector === "string") {
				if (selector.indexOf("@") === -1) request.user = {
					username: selector
				};
				else request.user = {
					email: selector
				};
			}
			request.password = hashPassword(password);
			client.call(
				"login",
				request,
				(err, result) => {
					if (err) {
						data.state = 0;
						cacher.set("login", "");
						data.user = null;
						return reject(err);
					}
					data.state = 1;
					cacher.set("login", result);
					notify();
					resolve(data.user);
				}
			);
		});
	exports.logout = () =>
		new Promise((resolve) =>
			client.call("logout", (err, res) => {
				let os = data.state;
				data.state = 0;
				cacher.set("login", "");
				data.user = null;
				if (os) notify();
				resolve(true);
			})
		);
	exports.createAccount = (selector, password) =>
		new Promise((resolve, reject) => {
			const request = {};
			data.state = 2;
			if (typeof selector === "string") {
				if (selector.indexOf("@") === -1) request.username = selector;
				else request.email = selector;
			}
			request.password = hashPassword(password);
			request.profile = {
				name: "用户-" + selector.slice(0, 10)
			}
			client.call(
				"createUser",
				request,
				(err, result) => {
					if (err) {
						data.state = 0;
						cacher.set("login", "");
						data.user = null;
						return reject(err);
					}
					data.state = 1;
					cacher.set("login", result);
					notify();
					resolve(data.user);
				}
			);
		});

	return exports
}
