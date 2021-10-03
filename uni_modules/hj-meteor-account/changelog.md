## 1.0.0（2021-10-03）
实现了对接meteor accounts-base+accounts-password的如下功能
1：开机自动重连 - 可以监听ddp.user.state是不是2表示在尝试登录，在1/0时再决定是不是登录用户
2：使用密码登录
3：注册新账号
4：退出登录
