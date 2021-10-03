
import { init } from "../../uni_modules/hj-ddp/js_sdk";
import { hjMeteorAccount } from "../../uni_modules/hj-meteor-account/js_sdk";

// #ifdef H5
export const ddp = init('ws://localhost:3002')
// #endif

// #ifndef H5
export const ddp = init('ws://10.0.2.2:3002')
// #endif

ddp.use(hjMeteorAccount)