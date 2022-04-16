var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const helper = {
	maxStack: function maxStack(msgError) {
		return new RegExp("Maximum call stack size exceeded", "g").test(msgError);
	},
	isFunction(fn) {
		return typeof fn === "function";
	},
	isObject(fn) {
		return typeof fn === "object";
	},
	keysOf(obj) {
		return Object.keys(obj);
	},
	lengthOf(obj) {
		return Object.keys(obj).length;
	},
	hasOwn(obj, prop) {
		return Object.prototype.hasOwnProperty.call(obj, prop);
	},
	convertMapToObject(map) {
		return Array.from(map).reduce(function(acc, _ref) {
			var key = _ref[0],
				value = _ref[1];
			acc[key] = value;
			return acc;
		}, {});
	},
	isArguments(obj) {
		return obj != null && this.hasOwn(obj, "callee");
	},
	isInfOrNaN(obj) {
		return Number.isNaN(obj) || obj === Infinity || obj === -Infinity;
	},
	handleError(fn) {
		return function(...args) {
			try {
				return fn.apply(this, args);
			} catch (error) {
				var isMaxStack = this.maxStack(error.message);
				if (isMaxStack) {
					throw new Error("Converting circular structure to JSON");
				}
				throw error;
			}
		};
	}
};
const BASE_64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BASE_64_VALS = Object.create(null);

function getChar(val) {
	return BASE_64_CHARS.charAt(val);
}

function getVal(ch) {
	return ch === "=" ? -1 : BASE_64_VALS[ch];
}
for (let i = 0; i < BASE_64_CHARS.length; i++) {
	BASE_64_VALS[getChar(i)] = i;
}

function encode(array) {
	if (typeof array === "string") {
		var str2 = array;
		array = newBinary(str2.length);
		for (var _i = 0; _i < str2.length; _i++) {
			var ch = str2.charCodeAt(_i);
			if (ch > 255) {
				throw new Error("Not ascii. Base64.encode can only take ascii strings.");
			}
			array[_i] = ch;
		}
	}
	var answer = [];
	var a = null;
	var b = null;
	var c = null;
	var d = null;
	for (var _i2 = 0; _i2 < array.length; _i2++) {
		switch (_i2 % 3) {
			case 0:
				a = array[_i2] >> 2 & 63;
				b = (array[_i2] & 3) << 4;
				break;
			case 1:
				b = b | array[_i2] >> 4 & 15;
				c = (array[_i2] & 15) << 2;
				break;
			case 2:
				c = c | array[_i2] >> 6 & 3;
				d = array[_i2] & 63;
				answer.push(getChar(a));
				answer.push(getChar(b));
				answer.push(getChar(c));
				answer.push(getChar(d));
				a = null;
				b = null;
				c = null;
				d = null;
				break;
		}
	}
	if (a != null) {
		answer.push(getChar(a));
		answer.push(getChar(b));
		if (c == null) {
			answer.push("=");
		} else {
			answer.push(getChar(c));
		}
		if (d == null) {
			answer.push("=");
		}
	}
	return answer.join("");
}

function newBinary(len) {
	if (typeof Uint8Array === "undefined" || typeof ArrayBuffer === "undefined") {
		const ret = [];
		for (let i = 0; i < len; i++) {
			ret.push(0);
		}
		ret.$Uint8ArrayPolyfill = true;
		return ret;
	}
	return new Uint8Array(new ArrayBuffer(len));
}

function decode(str2) {
	var len = Math.floor(str2.length * 3 / 4);
	if (str2.charAt(str2.length - 1) == "=") {
		len--;
		if (str2.charAt(str2.length - 2) == "=") {
			len--;
		}
	}
	let arr = newBinary(len);
	let one = null;
	let two = null;
	let three = null;
	let j = 0;
	for (let i = 0; i < str2.length; i++) {
		var c = str2.charAt(i);
		var v = getVal(c);
		switch (i % 4) {
			case 0:
				if (v < 0) {
					throw new Error("invalid base64 string");
				}
				one = v << 2;
				break;
			case 1:
				if (v < 0) {
					throw new Error("invalid base64 string");
				}
				one = one | v >> 4;
				arr[j++] = one;
				two = (v & 15) << 4;
				break;
			case 2:
				if (v >= 0) {
					two = two | v >> 2;
					arr[j++] = two;
					three = (v & 3) << 6;
				}
				break;
			case 3:
				if (v >= 0) {
					arr[j++] = three | v;
				}
				break;
		}
	}
	return arr;
}
const Base64 = {
	encode,
	decode,
	newBinary
};

function quote(string) {
	return JSON.stringify(string);
}

function str(key, holder, singleIndent, outerIndent, canonical) {
	var value = holder == null ? void 0 : holder[key];
	switch (typeof value) {
		case "string":
			return quote(value);
		case "number":
			return isFinite(value) ? String(value) : "null";
		case "boolean":
			return String(value);
		case "object": {
			if (!value) {
				return "null";
			}
			let innerIndent = outerIndent + singleIndent;
			let partial = [];
			let v;
			if (Array.isArray(value) || {}.hasOwnProperty.call(value, "callee")) {
				let length = value.length;
				for (var i = 0; i < length; i += 1) {
					partial[i] = str(i, value, singleIndent, innerIndent, canonical) || "null";
				}
				if (partial.length === 0) {
					v = "[]";
				} else if (innerIndent) {
					v = "[\n" + innerIndent + partial.join(",\n" + innerIndent) + "\n" + outerIndent + "]";
				} else {
					v = "[" + partial.join(",") + "]";
				}
				return v;
			}
			let keys = helper.keysOf(value);
			if (canonical) {
				keys = keys.sort();
			}
			keys.forEach(function(k) {
				v = str(k, value, singleIndent, innerIndent, canonical);
				if (v) {
					partial.push(quote(k) + (innerIndent ? ": " : ":") + v);
				}
			});
			if (partial.length === 0) {
				v = "{}";
			} else if (innerIndent) {
				v = "{\n" + innerIndent + partial.join(",\n" + innerIndent) + "\n" + outerIndent + "}";
			} else {
				v = "{" + partial.join(",") + "}";
			}
			return v;
		}
	}
}

function canonicalStringify(value, options) {
	const allOptions = Object.assign({
		indent: "",
		canonical: false
	}, options);
	if (allOptions.indent === true) {
		allOptions.indent = "  ";
	} else if (typeof allOptions.indent === "number") {
		var newIndent = "";
		for (var i = 0; i < allOptions.indent; i++) {
			newIndent += " ";
		}
		allOptions.indent = newIndent;
	}
	return str("", {
		"": value
	}, allOptions.indent, "", allOptions.canonical);
}
const EJSON = {
	addType(name, factory) {
		if (customTypes.has(name)) {
			throw new Error("Type ".concat(name, " already present"));
		}
		customTypes.set(name, factory);
	},
	toJSONValue(item) {
		var changed = toJSONValueHelper(item);
		if (changed !== void 0) {
			return changed;
		}
		var newItem = item;
		if (helper.isObject(item)) {
			newItem = EJSON.clone(item);
			adjustTypesToJSONValue(newItem);
		}
		return newItem;
	},
	fromJSONValue(item, ...args) {
		var changed = fromJSONValueHelper(item);
		if (changed === item && helper.isObject(item)) {
			changed = EJSON.clone(item);
			adjustTypesFromJSONValue(changed);
		}
		return changed;
	},
	stringify: helper.handleError(function(item, options) {
		var serialized;
		var json = EJSON.toJSONValue(item);
		if (options && (options.canonical || options.indent)) {
			serialized = canonicalStringify(json, options);
		} else {
			serialized = JSON.stringify(json);
		}
		return serialized;
	}),
	parse(item) {
		if (typeof item !== "string") {
			throw new Error("EJSON.parse argument should be a string");
		}
		return EJSON.fromJSONValue(JSON.parse(item));
	},
	isBinary(obj) {
		return !!(typeof Uint8Array !== "undefined" && obj instanceof Uint8Array || obj && obj.$Uint8ArrayPolyfill);
	},
	equals(a, b, options) {
		var i;
		var keyOrderSensitive = !!(options && options.keyOrderSensitive);
		if (a === b) {
			return true;
		}
		if (Number.isNaN(a) && Number.isNaN(b)) {
			return true;
		}
		if (!a || !b) {
			return false;
		}
		if (!(helper.isObject(a) && helper.isObject(b))) {
			return false;
		}
		if (a instanceof Date && b instanceof Date) {
			return a.valueOf() === b.valueOf();
		}
		if (EJSON.isBinary(a) && EJSON.isBinary(b)) {
			if (a.length !== b.length) {
				return false;
			}
			for (i = 0; i < a.length; i++) {
				if (a[i] !== b[i]) {
					return false;
				}
			}
			return true;
		}
		if (helper.isFunction(a.equals)) {
			return a.equals(b, options);
		}
		if (helper.isFunction(b.equals)) {
			return b.equals(a, options);
		}
		if (a instanceof Array) {
			if (!(b instanceof Array)) {
				return false;
			}
			if (a.length !== b.length) {
				return false;
			}
			for (i = 0; i < a.length; i++) {
				if (!EJSON.equals(a[i], b[i], options)) {
					return false;
				}
			}
			return true;
		}
		switch (Number(_isCustomType(a)) + Number(_isCustomType(b))) {
			case 1:
				return false;
			case 2:
				return EJSON.equals(EJSON.toJSONValue(a), EJSON.toJSONValue(b));
		}
		var ret;
		var aKeys = helper.keysOf(a);
		var bKeys = helper.keysOf(b);
		if (keyOrderSensitive) {
			i = 0;
			ret = aKeys.every(function(key) {
				if (i >= bKeys.length) {
					return false;
				}
				if (key !== bKeys[i]) {
					return false;
				}
				if (!EJSON.equals(a[key], b[bKeys[i]], options)) {
					return false;
				}
				i++;
				return true;
			});
		} else {
			i = 0;
			ret = aKeys.every(function(key) {
				if (!helper.hasOwn(b, key)) {
					return false;
				}
				if (!EJSON.equals(a[key], b[key], options)) {
					return false;
				}
				i++;
				return true;
			});
		}
		return ret && i === bKeys.length;
	},
	clone(v) {
		var ret;
		if (!helper.isObject(v)) {
			return v;
		}
		if (v === null) {
			return null;
		}
		if (v instanceof Date) {
			return new Date(v.getTime());
		}
		if (v instanceof RegExp) {
			return v;
		}
		if (EJSON.isBinary(v)) {
			ret = newBinary(v.length);
			for (var i = 0; i < v.length; i++) {
				ret[i] = v[i];
			}
			return ret;
		}
		if (Array.isArray(v)) {
			return v.map(EJSON.clone);
		}
		if (helper.isArguments(v)) {
			return Array.from(v).map(EJSON.clone);
		}
		if (helper.isFunction(v.clone)) {
			return v.clone();
		}
		if (_isCustomType(v)) {
			return EJSON.fromJSONValue(EJSON.clone(EJSON.toJSONValue(v)), true);
		}
		ret = {};
		helper.keysOf(v).forEach(function(key) {
			ret[key] = EJSON.clone(v[key]);
		});
		return ret;
	},
	newBinary: Base64.newBinary
};
const customTypes = new Map();
const builtinConverters = [{
	matchJSONValue: function matchJSONValue(obj) {
		return helper.hasOwn(obj, "$date") && helper.lengthOf(obj) === 1;
	},
	matchObject: function matchObject(obj) {
		return obj instanceof Date;
	},
	toJSONValue: function toJSONValue(obj) {
		return {
			$date: obj.getTime()
		};
	},
	fromJSONValue: function fromJSONValue(obj) {
		return new Date(obj.$date);
	}
}, {
	matchJSONValue: function matchJSONValue2(obj) {
		return helper.hasOwn(obj, "$regexp") && helper.hasOwn(obj, "$flags") && helper.lengthOf(obj) === 2;
	},
	matchObject: function matchObject2(obj) {
		return obj instanceof RegExp;
	},
	toJSONValue: function toJSONValue2(regexp) {
		return {
			$regexp: regexp.source,
			$flags: regexp.flags
		};
	},
	fromJSONValue: function fromJSONValue2(obj) {
		return new RegExp(obj.$regexp, obj.$flags.slice(0, 50).replace(/[^gimuy]/g, "").replace(
			/(.)(?=.*\1)/g, ""));
	}
}, {
	matchJSONValue: function matchJSONValue3(obj) {
		return helper.hasOwn(obj, "$InfNaN") && helper.lengthOf(obj) === 1;
	},
	matchObject: helper.isInfOrNaN,
	toJSONValue: function toJSONValue3(obj) {
		var sign;
		if (Number.isNaN(obj)) {
			sign = 0;
		} else if (obj === Infinity) {
			sign = 1;
		} else {
			sign = -1;
		}
		return {
			$InfNaN: sign
		};
	},
	fromJSONValue: function fromJSONValue3(obj) {
		return obj.$InfNaN / 0;
	}
}, {
	matchJSONValue: function matchJSONValue4(obj) {
		return helper.hasOwn(obj, "$binary") && helper.lengthOf(obj) === 1;
	},
	matchObject: function matchObject3(obj) {
		return typeof Uint8Array !== "undefined" && obj instanceof Uint8Array || obj && helper.hasOwn(obj,
			"$Uint8ArrayPolyfill");
	},
	toJSONValue: function toJSONValue4(obj) {
		return {
			$binary: Base64.encode(obj)
		};
	},
	fromJSONValue: function fromJSONValue4(obj) {
		return Base64.decode(obj.$binary);
	}
}, {
	matchJSONValue: function matchJSONValue5(obj) {
		return helper.hasOwn(obj, "$escape") && helper.lengthOf(obj) === 1;
	},
	matchObject: function matchObject4(obj) {
		var match = false;
		if (obj) {
			var keyCount = helper.lengthOf(obj);
			if (keyCount === 1 || keyCount === 2) {
				match = builtinConverters.some(function(converter) {
					return converter.matchJSONValue(obj);
				});
			}
		}
		return match;
	},
	toJSONValue: function toJSONValue5(obj) {
		var newObj = {};
		helper.keysOf(obj).forEach(function(key) {
			newObj[key] = EJSON.toJSONValue(obj[key]);
		});
		return {
			$escape: newObj
		};
	},
	fromJSONValue: function fromJSONValue5(obj) {
		var newObj = {};
		helper.keysOf(obj.$escape).forEach(function(key) {
			newObj[key] = EJSON.fromJSONValue(obj.$escape[key]);
		});
		return newObj;
	}
}, {
	matchJSONValue: function matchJSONValue6(obj) {
		return helper.hasOwn(obj, "$type") && helper.hasOwn(obj, "$value") && helper.lengthOf(obj) === 2;
	},
	matchObject: function matchObject5(obj) {
		return _isCustomType(obj);
	},
	toJSONValue: function toJSONValue6(obj) {
		var jsonValue = _noYieldsAllowed(function() {
			return obj.toJSONValue();
		});
		return {
			$type: obj.typeName(),
			$value: jsonValue
		};
	},
	fromJSONValue: function fromJSONValue6(obj) {
		var typeName = obj.$type;
		if (!customTypes.has(typeName)) {
			throw new Error("Custom EJSON type ".concat(typeName, " is not defined"));
		}
		var converter = customTypes.get(typeName);
		return _noYieldsAllowed(function() {
			return converter(obj.$value);
		});
	}
}];

function _noYieldsAllowed(f) {
	return f();
}

function _isCustomType(obj) {
	return obj && helper.isFunction(obj.toJSONValue) && helper.isFunction(obj.typeName) && customTypes.has(obj
	.typeName());
}

function toJSONValueHelper(item) {
	for (var i = 0; i < builtinConverters.length; i++) {
		var converter = builtinConverters[i];
		if (converter.matchObject(item)) {
			return converter.toJSONValue(item);
		}
	}
	return void 0;
}

function adjustTypesToJSONValue(obj) {
	if (obj === null) {
		return null;
	}
	var maybeChanged = toJSONValueHelper(obj);
	if (maybeChanged !== void 0) {
		return maybeChanged;
	}
	if (!helper.isObject(obj)) {
		return obj;
	}
	helper.keysOf(obj).forEach(function(key) {
		var value = obj[key];
		if (!helper.isObject(value) && value !== void 0 && !helper.isInfOrNaN(value)) {
			return;
		}
		var changed = toJSONValueHelper(value);
		if (changed) {
			obj[key] = changed;
			return;
		}
		adjustTypesToJSONValue(value);
	});
	return obj;
}

function fromJSONValueHelper(value) {
	if (helper.isObject(value) && value !== null) {
		var keys = helper.keysOf(value);
		if (keys.length <= 2 && keys.every(function(k) {
				return typeof k === "string" && k.substr(0, 1) === "$";
			})) {
			for (var i = 0; i < builtinConverters.length; i++) {
				var converter = builtinConverters[i];
				if (converter.matchJSONValue(value)) {
					return converter.fromJSONValue(value);
				}
			}
		}
	}
	return value;
}

function adjustTypesFromJSONValue(obj) {
	if (obj === null) {
		return null;
	}
	var maybeChanged = fromJSONValueHelper(obj);
	if (maybeChanged !== obj) {
		return maybeChanged;
	}
	if (!helper.isObject(obj)) {
		return obj;
	}
	helper.keysOf(obj).forEach(function(key) {
		var value = obj[key];
		if (helper.isObject(value)) {
			var changed = fromJSONValueHelper(value);
			if (value !== changed) {
				obj[key] = changed;
				return;
			}
			adjustTypesFromJSONValue(value);
		}
	});
	return obj;
}

function ProcessEmitWarning(warning) {
	if (console && console.warn)
		console.warn(warning);
}
class ExtError extends Error {}
var defaultMaxListeners = 10;
const _EventEmitter = class {
	constructor() {
		this._events = Object.create(null);
		this._eventsCount = 0;
		this._maxListeners = void 0;
	}
	static get defaultMaxListeners() {
		return defaultMaxListeners;
	}
	get maxListeners() {
		if (this._maxListeners === void 0)
			return _EventEmitter.defaultMaxListeners;
		return this._maxListeners;
	}
	set maxListeners(v) {
		if (v < 0 || !Number.isSafeInteger(v)) {
			throw new RangeError(
				'The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' +
				v + ".");
		}
		this._maxListeners = v;
	}
	set defaultMaxListeners(v) {
		if (v < 0 || !Number.isSafeInteger(v)) {
			throw new RangeError(
				'The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' +
				v + ".");
		}
		defaultMaxListeners = v;
	}
	emit(type, ...args) {
		var doError = type === "error";
		var events = this._events;
		if (events !== void 0) {
			doError = doError && events.error === void 0;
		} else if (!doError)
			return false;
		if (doError) {
			var er;
			if (args.length > 0)
				er = args[0];
			if (er instanceof Error) {
				throw er;
			}
			var err = new ExtError("Unhandled error." + (er ? " (" + er.message + ")" : ""));
			err.context = er;
			throw err;
		}
		var handlers = events[type];
		if (handlers === void 0)
			return false;
		for (const el of handlers) {
			el.apply(this, args);
		}
		return true;
	}
	on(type, listener, prepend = false) {
		checkListener(listener);
		const events = this._events;
		if (events.newListener !== void 0) {
			this.emit("newListener", type, listener.listener ? listener.listener : listener);
		}
		let list = events[type];
		if (!list) {
			events[type] = [listener];
			++this._eventsCount;
		} else {
			if (prepend) {
				list.unshift(listener);
			} else {
				list.push(listener);
			}
			const m = this.maxListeners;
			if (m > 0 && list.length > m && !list.warned) {
				list.warned = true;
				var w = new ExtError("Possible EventEmitter memory leak detected. " + list.length + " " +
					String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
				w.name = "MaxListenersExceededWarning";
				w.emitter = this;
				w.type = type;
				w.count = list.length;
				ProcessEmitWarning(w);
			}
		}
		return this;
	}
	once(type, listener, prepend = false) {
		checkListener(listener);
		const nf = (...args) => {
			listener.apply(null, args);
			this.off(type, nf);
		};
		this.on(type, nf, prepend);
		return this;
	}
	off(type, listener) {
		if (!type) {
			this._events = Object.create(null);
			this._eventsCount = 0;
			return this;
		}
		const list = this._events[type];
		if (!(list == null ? void 0 : list.length))
			return this;
		if (!listener) {
			this._eventsCount -= list.length;
			delete this._events[type];
		} else {
			const i = list.indexOf(listener);
			if (i > -1) {
				list.splice(i, 1);
				this._eventsCount--;
			}
		}
		return this;
	}
	listenerCount(type) {
		var _a;
		return ((_a = this._events[type]) == null ? void 0 : _a.length) || 0;
	}
	eventNames() {
		return this._eventsCount > 0 ? Object.keys(this._events) : [];
	}
};
let EventEmitter = _EventEmitter;
EventEmitter.EventEmitter = _EventEmitter;

function checkListener(listener) {
	if (typeof listener !== "function") {
		throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
	}
}
class UniSocket {
	constructor(url, protocols, ops) {
		this.onmessage = null;
		this.onclose = null;
		this.onerror = null;
		this.onopen = null;
		const task = uni.connectSocket(__spreadProps(__spreadValues({
			url,
			protocols
		}, ops), {
			success: () => {}
		}));
		task.onClose(() => {
			var _a;
			(_a = this.onclose) == null ? void 0 : _a.call(this);
		});
		task.onError((err) => {
			var _a;
			(_a = this.onerror) == null ? void 0 : _a.call(this, err);
		});
		task.onOpen(() => {
			var _a;
			(_a = this.onopen) == null ? void 0 : _a.call(this);
		});
		task.onMessage((ev) => {
			var _a;
			(_a = this.onmessage) == null ? void 0 : _a.call(this, ev);
		});
		this.instance = task;
	}
	send(e) {
		this.instance.send({
			data: e
		});
	}
	close() {
		var _a;
		(_a = this.instance) == null ? void 0 : _a.close();
	}
}
const _UniDB = class {
	constructor(name, prefix = "db") {
		this.name = name;
		this.prefix = prefix;
		if (_UniDB.dbs.has(name)) {
			return _UniDB.dbs.get(name);
		}
		_UniDB.dbs.set(name, this);
	}
	static info() {
		return uni.getStorageInfoSync();
	}
	sk(key) {
		return `${this.prefix}.${this.name}.${key}`;
	}
	get(key) {
		return uni.getStorageSync(this.sk(key));
	}
	set(key, val) {
		return uni.setStorageSync(this.sk(key), val);
	}
	remove(key) {
		return uni.removeStorageSync(this.sk(key));
	}
	keys() {
		const info = uni.getStorageInfoSync()
		return info.keys.filter(key => key.startsWith(`${this.prefix}.${this.name}.`))
	}
};
let UniDB = _UniDB;
UniDB.dbs = new Map();
const invariant = function(condition, format, a, b, c, d, e, f) {
	if (!condition) {
		var error;
		if (format === void 0) {
			error = new Error(
				"Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings."
				);
		} else {
			var args = [a, b, c, d, e, f];
			var argIndex = 0;
			error = new Error(format.replace(/%s/g, function() {
				return args[argIndex++];
			}));
			error.name = "Invariant Violation";
		}
		error.framesToPop = 1;
		throw error;
	}
};
export {
	Base64,
	EJSON,
	EventEmitter,
	UniDB,
	UniSocket,
	helper,
	invariant
};
