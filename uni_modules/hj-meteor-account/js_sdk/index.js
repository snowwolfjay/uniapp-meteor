import { UniDB } from "../../hj-core/js_sdk";

export function hjMeteorAccount(client, opts) {
  const users = client.db.collection("users");
  const cacher = opts?.cacher || new UniDB("hj-meteor-user");
  const od = cacher.get("login");
  const ucs = [];
  client.user = {
    state: 0,
    info: null,
    onChange(cb) {
      ucs.push(cb);
    },
  };
  function notify() {
    ucs.forEach((cb) => {
      if (typeof cb === "function") cb(client.user.info);
    });
  }
  if (od) {
    if (new Date(od.tokenExpires).getTime() > Date.now()) {
      //   relogin
      client.user.state = 2;
      client.call("login", { resume: od.token }, (err, result) => {
        if (err) {
          client.user.state = 0;
          cacher.set("login", "");
          client.user.info = null;
          return;
        } else {
          client.user.state = 1;
          cacher.set("login", result);
          client.user.info = users.findOne(result.id);
        }
        notify();
      });
    } else cacher.set("login", "");
  }
  client.loginWithPassword = (selector, password) =>
    new Promise((resolve, reject) => {
      const request = {};
      client.user.state = 2;
      if (typeof selector === "string") {
        if (selector.indexOf("@") === -1) request.username = selector;
        else request.email = selector;
      }
      request.password = password;
      client.call(
        "login",
        request,
        (err, result) => {
          if (err) {
            client.user.state = 0;
            cacher.set("login", "");
            client.user.info = null;
            return reject(err);
          }
          client.user.state = 1;
          cacher.set("login", result);
          client.user.info = users.findOne(result.id);
          notify();
          resolve(client.user.info);
        }
      );
    });
  client.logout = () =>
    new Promise((resolve) =>
      client.call("logout", (err, res) => {
        let os = client.user.state;
        client.user.state = 0;
        cacher.set("login", "");
        client.user.info = null;
        if (os) notify();
        resolve(true);
      })
    );
  client.createAccount = (selector, password) =>
    new Promise((resolve, reject) => {
      const request = {};
      client.user.state = 2;
      if (typeof selector === "string") {
        if (selector.indexOf("@") === -1) request.username = selector;
        else request.email = selector;
      }
      request.password = password;
      request.profile = {
        name: "用户-" + selector.slice(0, 10)
      }
      client.call(
        "createUser",
        request,
        (err, result) => {
          if (err) {
            client.user.state = 0;
            cacher.set("login", "");
            client.user.info = null;
            return reject(err);
          }
          client.user.state = 1;
          cacher.set("login", result);
          client.user.info = users.findOne(result.id);
          notify();
          resolve(client.user.info);
        }
      );
    });
}
