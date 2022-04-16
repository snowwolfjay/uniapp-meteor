export interface DDPClientOption {
  socketConstructor?: Socket;
  tlsOpts?: any;
  autoReconnect?: boolean;
  autoReconnectTimer?: number;
  maintainCollections?: boolean;
  url?: string;
  ddpVersion?: string;
  storageKey?: string;
}
export interface Socket {
  send: (msg: string | ArrayBuffer) => any;
  onclose: (ev: { code?: number; reason?: string }) => void;
  onopen: () => void;
  onmessage: (msg: { data: any }) => void;
  close: () => void;
  onerror: (err: any) => void;
}
export interface SocketConstructor {
  new (url: string, protos?: string | string[], confs?: any): Socket;
}
type subscribeReadyFunction = (
  err?: any,
  handler?: {
    id: string;
    name: string;
    params: any;
    stop(): void;
  }
) => void;
export interface DDPClient {
  connection: DDPConnection;
  call(name: string, ...args: any[]): void;
  subscribe(
    name: string,
    ready?: subscribeReadyFunction,
    ...args: any[]
  ): string;
  subscribe(name: string, ...args: any[]): string;
  unsubscribe(id: string): void;
  destroy(): void;
  isReady(): Promise<void>;
  isClose(): Promise<void>;
  onReady(cb: () => void): () => void;
  onClose(cb: () => void): () => void;
}

export interface EventEmitter {
  maxListeners: number;
  emit(type, ...args): boolean;
  on(type, listener, prepend?: boolean);
  once(type, listener, prepend?: boolean): EventEmitter;
  off(type, listener): EventEmitter;
  listenerCount(type): number;
  eventNames(): string[];
}
export enum DDPConnectionState {
  CLOSED = 0,
  CONNECTING = 1,
  CONNECTED = 2,
  READY = 3,
  FAIL = 4,
  CLOSING = 5,
  RECONNECTING = 6,
}
export interface DDPConnection extends EventEmitter {
  tlsOpts: any;
  autoReconnect: boolean;
  autoReconnectTimer: number;
  url: string;
  socketConstructor: SocketConstructor;
  ddpVersion: string;
  socket: Socket;
  session: any;
  state: DDPConnectionState;
  isSocketBusy: boolean;
  connect(url?: string, protos?: any, data?: any): void;
  close(): void;
  call(name, params, callback?: any, updatedCallback?: any): void;
  subscribe(
    name: string,
    params: any[],
    callback?: subscribeReadyFunction
  ): string;
  unsubscribe(id: string): void;
}

type Dictionary<T> = { [key: string]: T };
export function connect(opt: DDPClientOption | string): DDPClient;
