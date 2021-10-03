var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
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
import { EventEmitter, UniSocket, EJSON, UniDB } from "../../hj-core/js_sdk";
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
    this.db = opts.db;
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
    return this.state === DDPConnectionState.CLOSING || this.state === DDPConnectionState.CONNECTING || this.state === DDPConnectionState.RECONNECTING;
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
      this.emit("socket-close", ev == null ? void 0 : ev.code, ev == null ? void 0 : ev.reason);
      this._endPendingMethodCalls();
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
  call(name, params, callback, updatedCallback) {
    var id = this._getNextId();
    if (typeof callback === "function") {
      this._pendingMethods[id] = true;
      this._callbacks[id] = (...args) => {
        delete this._pendingMethods[id];
        if (callback) {
          callback.apply(this, args);
        }
      };
    }
    if (typeof updatedCallback === "function") {
      this._pendingMethods[id] = true;
      this._updatedCallbacks[id] = (...args) => {
        delete this._pendingMethods[id];
        if (updatedCallback) {
          updatedCallback.apply(this, args);
        }
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
      this._callbacks[id] = () => {
        callback({
          id,
          name,
          params,
          stop: () => this.unsubscribe(id)
        });
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
        return el.method&&el.method === data.method && JSON.stringify(el.params) === JSON.stringify(data.params);
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
	this.emit('ddp-message',data)
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
      case "added": {
        this.db.update(data.collection, "added", data.id, data.fields);
        break;
      }
      case "removed": {
        this.db.update(data.collection, "removed", data.id);
        break;
      }
      case "changed": {
        this.db.update(data.collection, "changed", data.id, data.fields, data.cleared);
        break;
      }
      case "addedBefore ": {
        this.db.update(data.collection, "addedBefore", data.id, data.fields, data.before);
        break;
      }
      case "movedBefore": {
        this.db.update(data.collection, "movedBefore", data.id, data.before);
        break;
      }
      case "ready": {
        Array.from(data.subs).forEach((id) => {
          this.revokeCallBack(id);
        });
        break;
      }
      case "ping": {
        this.send(Object.prototype.hasOwnProperty.call(data, "id") ? { msg: "pong", id: data.id } : { msg: "pong" });
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
        this._callbacks[id](new Error("DDPClient: Disconnected from DDP server"));
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
const _CollectionObserver = class {
  constructor(name, handler, id = null) {
    this.name = name;
    this.handler = handler;
    this.id = id;
    if (!_CollectionObserver.observers.has(name)) {
      _CollectionObserver.observers.set(name, [this]);
    } else {
      const observers = _CollectionObserver.observers.get(name);
      if (id) {
        const sameObserver = observers.find((el) => el.id === id);
        if (sameObserver)
          return sameObserver;
      } else
        observers.push(this);
    }
  }
  static getObservers(name) {
    if (!_CollectionObserver.observers.has(name)) {
      return [];
    } else {
      return _CollectionObserver.observers.get(name);
    }
  }
  static notify(name, type, ...args) {
    const observers = this.getObservers(name);
    if (!observers.length)
      return;
    observers.forEach((observer) => {
      var _a, _b;
      try {
        const handler = observer.handler[type];
        handler && handler.apply(observer, args);
      } catch (error) {
        (_b = (_a = observer.handler) == null ? void 0 : _a.error) == null ? void 0 : _b.call(observer, error);
      }
    });
  }
  get brothers() {
    return _CollectionObserver.observers.get(this.name);
  }
  stop() {
    const index = this.brothers.findIndex((e) => e === this);
    if (index) {
      this.brothers.splice(index, 1);
    }
  }
};
let CollectionObserver = _CollectionObserver;
CollectionObserver.observers = new Map();
var LocalCollection = {};
var isArray = function isArray2(x) {
  return Array.isArray(x) && !EJSON.isBinary(x);
};
var _anyIfArray = function _anyIfArray2(x, f) {
  if (isArray(x))
    return x.some((e) => f(e));
  return f(x);
};
var _anyIfArrayPlus = function _anyIfArrayPlus2(x, f) {
  if (f(x))
    return true;
  return isArray(x) && x.some((e) => f(e));
};
var hasOperators = function hasOperators2(valueSelector) {
  var theseAreOperators = void 0;
  for (var selKey in valueSelector) {
    var thisIsOperator = selKey.substr(0, 1) === "$";
    if (theseAreOperators === void 0) {
      theseAreOperators = thisIsOperator;
    } else if (theseAreOperators !== thisIsOperator) {
      throw new Error("Inconsistent selector: " + valueSelector);
    }
  }
  return !!theseAreOperators;
};
var isObject = (v) => Object.prototype.toString.call(v).slice(8, -1) === "Object";
var compileValueSelector = function compileValueSelector2(valueSelector) {
  if (valueSelector == null) {
    return function(value) {
      return _anyIfArray(value, function(x) {
        return x == null;
      });
    };
  }
  if (!isObject(valueSelector)) {
    return function(value) {
      return _anyIfArray(value, function(x) {
        return x === valueSelector;
      });
    };
  }
  if (valueSelector instanceof RegExp) {
    return function(value) {
      if (value === void 0)
        return false;
      return _anyIfArray(value, function(x) {
        return valueSelector.test(x);
      });
    };
  }
  if (isArray(valueSelector)) {
    return function(value) {
      if (!isArray(value))
        return false;
      return _anyIfArrayPlus(value, function(x) {
        return LocalCollection._f._equal(valueSelector, x);
      });
    };
  }
  if (hasOperators(valueSelector)) {
    var operatorFunctions = [];
    Object.keys(valueSelector).forEach((operator) => {
      const operand = valueSelector[operator];
      if (!VALUE_OPERATORS[operator])
        throw new Error("Unrecognized operator: " + operator);
      operatorFunctions.push(VALUE_OPERATORS[operator](operand, valueSelector.$options));
    });
    return function(value) {
      return operatorFunctions.every(function(f) {
        return f(value);
      });
    };
  }
  return function(value) {
    return _anyIfArray(value, function(x) {
      return LocalCollection._f._equal(valueSelector, x);
    });
  };
};
var LOGICAL_OPERATORS = {
  $and(subSelector) {
    if (!isArray(subSelector) || !subSelector)
      throw Error("$and/$or/$nor must be nonempty array");
    var subSelectorFunctions = subSelector.map(_compileDocumentSelector);
    return function(doc) {
      return subSelectorFunctions.every(function(f) {
        return f(doc);
      });
    };
  },
  $or(subSelector) {
    if (!isArray(subSelector) || !subSelector)
      throw Error("$and/$or/$nor must be nonempty array");
    var subSelectorFunctions = subSelector.map((v) => _compileDocumentSelector(v));
    return function(doc) {
      return subSelectorFunctions.some(function(f) {
        return f(doc);
      });
    };
  },
  $nor(subSelector) {
    if (!isArray(subSelector) || !subSelector)
      throw Error("$and/$or/$nor must be nonempty array");
    var subSelectorFunctions = subSelector.map((v) => _compileDocumentSelector(v));
    return function(doc) {
      return subSelectorFunctions.some(function(f) {
        return !f(doc);
      });
    };
  },
  $where(selectorValue) {
    if (!(selectorValue instanceof Function)) {
      selectorValue = Function("return " + selectorValue);
    }
    return function(doc) {
      return selectorValue.call(doc);
    };
  }
};
var VALUE_OPERATORS = {
  $in(operand) {
    if (!isArray(operand))
      throw new Error("Argument to $in must be array");
    return function(value) {
      return _anyIfArrayPlus(value, function(x) {
        return operand.some(function(operandElt) {
          return LocalCollection._f._equal(operandElt, x);
        });
      });
    };
  },
  $all(operand) {
    if (!isArray(operand))
      throw new Error("Argument to $all must be array");
    return function(value) {
      if (!isArray(value))
        return false;
      return operand.every(function(operandElt) {
        return value.some(function(valueElt) {
          return LocalCollection._f._equal(operandElt, valueElt);
        });
      });
    };
  },
  $lt(operand) {
    return function(value) {
      return _anyIfArray(value, function(x) {
        return LocalCollection._f._cmp(x, operand) < 0;
      });
    };
  },
  $lte(operand) {
    return function(value) {
      return _anyIfArray(value, function(x) {
        return LocalCollection._f._cmp(x, operand) <= 0;
      });
    };
  },
  $gt(operand) {
    return function(value) {
      return _anyIfArray(value, function(x) {
        return LocalCollection._f._cmp(x, operand) > 0;
      });
    };
  },
  $gte(operand) {
    return function(value) {
      return _anyIfArray(value, function(x) {
        return LocalCollection._f._cmp(x, operand) >= 0;
      });
    };
  },
  $ne(operand) {
    return function(value) {
      return !_anyIfArrayPlus(value, function(x) {
        return LocalCollection._f._equal(x, operand);
      });
    };
  },
  $nin(operand) {
    if (!isArray(operand))
      throw new Error("Argument to $nin must be array");
    var inFunction = VALUE_OPERATORS.$in(operand);
    return function(value) {
      if (value === void 0)
        return true;
      return !inFunction(value);
    };
  },
  $exists(operand) {
    return function(value) {
      return operand === (value !== void 0);
    };
  },
  $mod(operand) {
    var divisor = operand[0], remainder = operand[1];
    return function(value) {
      return _anyIfArray(value, function(x) {
        return x % divisor === remainder;
      });
    };
  },
  $size(operand) {
    return function(value) {
      return isArray(value) && operand === value.length;
    };
  },
  $type(operand) {
    return function(value) {
      if (value === void 0)
        return false;
      return _anyIfArray(value, function(x) {
        return LocalCollection._f._type(x) === operand;
      });
    };
  },
  $regex(operand, options) {
    if (options !== void 0) {
      if (/[^gim]/.test(options))
        throw new Error("Only the i, m, and g regexp options are supported");
      var regexSource = operand instanceof RegExp ? operand.source : operand;
      operand = new RegExp(regexSource, options);
    } else if (!(operand instanceof RegExp)) {
      operand = new RegExp(operand);
    }
    return function(value) {
      if (value === void 0)
        return false;
      return _anyIfArray(value, function(x) {
        return operand.test(x);
      });
    };
  },
  $options(operand) {
    return function(value) {
      return true;
    };
  },
  $elemMatch(operand) {
    var matcher = _compileDocumentSelector(operand);
    return function(value) {
      if (!isArray(value))
        return false;
      return value.some(function(x) {
        return matcher(x);
      });
    };
  },
  $not(operand) {
    var matcher = compileValueSelector(operand);
    return function(value) {
      return !matcher(value);
    };
  },
  $near(operand) {
    return function(value) {
      return true;
    };
  },
  $geoIntersects(operand) {
    return function(value) {
      return true;
    };
  }
};
LocalCollection._f = {
  _type: function _type(v) {
    if (typeof v === "number")
      return 1;
    if (typeof v === "string")
      return 2;
    if (typeof v === "boolean")
      return 8;
    if (isArray(v))
      return 4;
    if (v === null)
      return 10;
    if (v instanceof RegExp)
      return 11;
    if (typeof v === "function")
      return 13;
    if (v instanceof Date)
      return 9;
    if (EJSON.isBinary(v))
      return 5;
    return 3;
  },
  _equal: function _equal(a, b) {
    return EJSON.equals(a, b, { keyOrderSensitive: true });
  },
  _typeorder: function _typeorder(t) {
    return [
      -1,
      1,
      2,
      3,
      4,
      5,
      -1,
      6,
      7,
      8,
      0,
      9,
      -1,
      100,
      2,
      100,
      1,
      8,
      1
    ][t];
  },
  _cmp: function _cmp(a, b) {
    if (a === void 0)
      return b === void 0 ? 0 : -1;
    if (b === void 0)
      return 1;
    var ta = LocalCollection._f._type(a);
    var tb = LocalCollection._f._type(b);
    var oa = LocalCollection._f._typeorder(ta);
    var ob = LocalCollection._f._typeorder(tb);
    if (oa !== ob)
      return oa < ob ? -1 : 1;
    if (ta !== tb)
      throw Error("Missing type coercion logic in _cmp");
    if (ta === 7) {
      ta = tb = 2;
      a = a.toHexString();
      b = b.toHexString();
    }
    if (ta === 9) {
      ta = tb = 1;
      a = a.getTime();
      b = b.getTime();
    }
    if (ta === 1)
      return a - b;
    if (tb === 2)
      return a < b ? -1 : a === b ? 0 : 1;
    if (ta === 3) {
      var to_array = function to_array2(obj) {
        var ret = [];
        for (var key in obj) {
          ret.push(key);
          ret.push(obj[key]);
        }
        return ret;
      };
      return LocalCollection._f._cmp(to_array(a), to_array(b));
    }
    if (ta === 4) {
      for (var i = 0; ; i++) {
        if (i === a.length)
          return i === b.length ? 0 : -1;
        if (i === b.length)
          return 1;
        var s = LocalCollection._f._cmp(a[i], b[i]);
        if (s !== 0)
          return s;
      }
    }
    if (ta === 5) {
      if (a.length !== b.length)
        return a.length - b.length;
      for (i = 0; i < a.length; i++) {
        if (a[i] < b[i])
          return -1;
        if (a[i] > b[i])
          return 1;
      }
      return 0;
    }
    if (ta === 8) {
      if (a)
        return b ? 0 : 1;
      return b ? -1 : 0;
    }
    if (ta === 10)
      return 0;
    if (ta === 11)
      throw Error("Sorting not supported on regular expression");
    if (ta === 13)
      throw Error("Sorting not supported on Javascript code");
    throw Error("Unknown type to sort");
  }
};
LocalCollection._matches = function(selector, doc) {
  return LocalCollection._compileSelector(selector)(doc);
};
LocalCollection._makeLookupFunction = function(key) {
  var dotLocation = key.indexOf(".");
  var first, lookupRest, nextIsNumeric;
  if (dotLocation === -1) {
    first = key;
  } else {
    first = key.substr(0, dotLocation);
    var rest = key.substr(dotLocation + 1);
    lookupRest = LocalCollection._makeLookupFunction(rest);
    nextIsNumeric = /^\d+(\.|$)/.test(rest);
  }
  return function(doc) {
    if (doc == null)
      return [void 0];
    var firstLevel = doc[first];
    if (!lookupRest)
      return [firstLevel];
    if (isArray(firstLevel) && firstLevel.length === 0)
      return [void 0];
    if (!isArray(firstLevel) || nextIsNumeric)
      firstLevel = [firstLevel];
    return Array.prototype.concat.apply([], firstLevel.map((v) => lookupRest(v)));
  };
};
function _compileDocumentSelector(docSelector) {
  var perKeySelectors = [];
  Object.keys(docSelector).forEach(function(key) {
    const subSelector = docSelector[key];
    if (key.substr(0, 1) === "$") {
      if (!LOGICAL_OPERATORS[key])
        throw new Error("Unrecognized logical operator: " + key);
      perKeySelectors.push(LOGICAL_OPERATORS[key](subSelector));
    } else {
      var lookUpByIndex = LocalCollection._makeLookupFunction(key);
      var valueSelectorFunc = compileValueSelector(subSelector);
      perKeySelectors.push(function(doc) {
        var branchValues = lookUpByIndex(doc);
        return branchValues.some((v) => valueSelectorFunc(v));
      });
    }
  });
  return function(doc) {
    return perKeySelectors.every(function(f) {
      return f(doc);
    });
  };
}
LocalCollection._compileSelector = function(selector) {
  if (!selector) {
    return () => true;
  }
  if (selector instanceof Function)
    return selector;
  if (typeof selector === "string" || typeof selector === "number") {
    return function(doc) {
      return doc._id === selector;
    };
  }
  if ("_id" in selector && !selector._id)
    return function(doc) {
      return false;
    };
  if (typeof selector === "boolean" || isArray(selector) || EJSON.isBinary(selector))
    throw new Error("Invalid selector: " + selector);
  return _compileDocumentSelector(selector);
};
const compileSelector = LocalCollection._compileSelector;
class Collection {
  constructor(name, db, observeKey = name + "-" + db.name) {
    this.name = name;
    this.db = db;
    this.observeKey = observeKey;
    this.sources = [];
    this.sources[0];
  }
  find(selector, options) {
    const filter = compileSelector(selector);
    const result = [];
    const transform = (options == null ? void 0 : options.transform) || ((doc) => doc);
    for (const doc of this.sources) {
      if (filter(doc)) {
        result.push(transform(doc));
      }
    }
    return result;
  }
  findOne(selector, options) {
    const filter = compileSelector(selector);
    let result = null;
    const transform = (options == null ? void 0 : options.transform) || ((doc) => doc);
    for (const doc of this.sources) {
      if (filter(doc)) {
        result = transform(doc);
        break;
      }
    }
    return result;
  }
  insert(data) {
    if (!(data == null ? void 0 : data._id))
      return console.warn("remote doc need _id");
    const index = this.sources.findIndex((el) => el._id === data._id);
    if (index > -1) {
      this.sources.splice(index, 1, data);
      CollectionObserver.notify(this.observeKey, "changed", data._id, data);
    } else {
      this.sources.push(data);
      CollectionObserver.notify(this.observeKey, "added", data._id, deepCopy(data));
    }
  }
  upsert(selector, data) {
    if (!selector)
      return;
    const filter = compileSelector(selector);
    let count = 0;
    this.sources.forEach((doc) => {
      if (!filter(doc))
        return;
      Object.assign(doc, data);
      count++;
      for (const key of Object.keys(doc)) {
        if (doc[key] === void 0)
          delete doc[key];
      }
      CollectionObserver.notify(this.observeKey, "changed", doc.id, deepCopy(doc));
    });
    if (count === 0 && data.id) {
      this.insert(data);
      count++;
    }
    return count;
  }
  remove(id) {
    if (!id)
      return;
    const index = this.sources.findIndex((el) => el.id === id);
    if (index > -1)
      this.sources.splice(index, 1);
    CollectionObserver.notify(this.observeKey, "removed", id);
  }
  observe(handler) {
    return new CollectionObserver(this.observeKey, handler);
  }
}
function removeKeys(source, keys) {
  keys = keys || Object.keys(source);
  keys.forEach((key) => delete source[key]);
}
const _MiniMongo = class {
  constructor(name, cache) {
    this.name = name;
    this.cache = cache;
    this.collections = new Map();
  }
  static connect(name, cache = true) {
    if (cache) {
      const sysDb = new UniDB("sys");
      let list = sysDb.get("mongodbs");
      if (!Array.isArray(list)) {
        list = [name];
        sysDb.set("mongodbs", list);
      }
    }
    if (_MiniMongo.dbs.has(name))
      return _MiniMongo.dbs.get(name);
    return new _MiniMongo(name, cache);
  }
  collection(name) {
    let col = this.collections.get(name);
    if (!col)
      this.collections.set(name, col = new Collection(name, this));
    return col;
  }
  observe(name, handler) {
    return this.collection(name).observe(handler);
  }
  update(name, type, ...args) {
    const collection = this.collection(name);
    switch (type) {
      case "added": {
        const [_id, item] = args;
        collection.insert(__spreadValues({
          _id
        }, item));
        break;
      }
      case "removed": {
        const [_id] = args;
        collection.remove(_id);
        break;
      }
      case "changed": {
        const [_id, fields = {}, cleard] = args;
        if (Array.isArray(cleard))
          cleard.forEach((key) => {
            fields[key] = void 0;
          });
        fields._id = _id;
        collection.upsert(_id, fields);
        break;
      }
    }
  }
};
let MiniMongo = _MiniMongo;
MiniMongo.dbs = new Map();
var IDDPConnectionState;
(function(IDDPConnectionState2) {
  IDDPConnectionState2[IDDPConnectionState2["CLOSED"] = 0] = "CLOSED";
  IDDPConnectionState2[IDDPConnectionState2["CONNECTING"] = 1] = "CONNECTING";
  IDDPConnectionState2[IDDPConnectionState2["CONNECTED"] = 2] = "CONNECTED";
  IDDPConnectionState2[IDDPConnectionState2["READY"] = 3] = "READY";
  IDDPConnectionState2[IDDPConnectionState2["FAIL"] = 4] = "FAIL";
  IDDPConnectionState2[IDDPConnectionState2["CLOSING"] = 5] = "CLOSING";
  IDDPConnectionState2[IDDPConnectionState2["RECONNECTING"] = 6] = "RECONNECTING";
})(IDDPConnectionState || (IDDPConnectionState = {}));
const _Client = class {
  constructor({
    url = "ws://localhost:3000/websocket",
    storageKey = "u"
  }) {
    this.plugins = {};
    if (_Client.clients.has(url))
      return _Client.clients.get(url);
    _Client.clients.set(url, this);
    this.db = MiniMongo.connect(storageKey);
    this.connection = new DDPConnection({
      url,
      db: this.db
    });
  }
  use(plugin, opts) {
    const pluginName = plugin.name;
    if (!pluginName)
      return console.warn("need name");
    if (this[pluginName])
      return console.warn(`\u51B2\u7A81\u7684${pluginName}`);
    const setupFunction = plugin.setup || plugin;
    let pluginObj = null;
    if (typeof setupFunction === "function") {
      pluginObj = setupFunction(this, opts);
    } else {
      pluginObj = plugin;
    }
    if (pluginObj) {
      this.plugins[pluginName] = pluginObj;
      Object.defineProperty(this, pluginName, {
        get() {
          return this.plugins[pluginName];
        }
      });
    }
  }
  map(source, listHolder, selector, options) {
    const collection = typeof source === "string" ? this.db.collection(source) : source;
    const filter = compileSelector(selector);
    const inits = collection.find(filter, options);
    if (inits.length !== 0)
      listHolder.push(...inits);
    const transform = (options == null ? void 0 : options.transform) || ((doc) => doc);
    const ob = new CollectionObserver(collection.observeKey, {
      added(_id, item) {
        const doc = __spreadProps(__spreadValues({}, item), { _id, id: _id });
        if (!filter(doc))
          return;
        listHolder.push(transform(doc));
      },
      changed(_id, fields, removed = []) {
        const index = listHolder.findIndex((e) => e._id = _id);
        if (index > -1) {
          const no = __spreadValues(__spreadValues({}, listHolder[index]), fields);
          removeKeys(no, removed);
          if (filter(no)) {
            listHolder.splice(index, 1, transform(no));
          } else {
            listHolder.splice(index, 1);
          }
        } else {
          this.added(_id, fields);
        }
      },
      removed(_id) {
        const index = listHolder.findIndex((e) => e._id = _id);
        if (index > -1) {
          listHolder.splice(index, 1);
        }
      }
    }, options == null ? void 0 : options.id);
    return {
      stop() {
        ob.stop();
      }
    };
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
let Client = _Client;
Client.clients = new Map();
const buildedClients = new Map();
function init(opt) {
  if (!opt)
    opt = "ws://localhost:3000/websocket";
  const userOpt = typeof opt === "string" ? {
    url: opt
  } : opt;
  if (buildedClients.has(userOpt.url))
    return buildedClients.get(userOpt.url);
  return new Client(__spreadValues({ socketConstructor: UniSocket }, userOpt));
}
export { IDDPConnectionState, init };
