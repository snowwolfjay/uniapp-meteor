export interface IDDPClientOption {
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
export interface IDDPOption {
  socketConstructor?: SocketConstructor;
  tlsOpts?: any;
  autoConnect?: boolean;
  autoReconnect?: boolean;
  autoReconnectTimer?: number;
  maintainCollections?: boolean;
  url?: string;
  ddpVersion?: string;
  db: IMongo;
}
export interface IDDPClient {
  connection: IDDPConnection;
  db: IMongo;
  use(plugin:any,options?:any):any
  call(name: string, arg?: any, ready?: Function, updated?: Function): void;
  subscribe(name: string, arg?: any, ready?: Function): string;
  unsubscribe(id: string): void;
  destroy(): void;
  map<T extends IDocument = any>(
    collectionName: string | ICollection<T>,
    holder: any[],
    selector: any,
    options?: { id?: string; transform: (doc: any) => any }
  ): {
    stop: () => void;
  };
}
export interface IMongo {
  collection<T extends IDocument = any>(name: string): ICollection<T>;
  name: string;
}
export interface IDocument {
  _id: string;
  [key: string]: any;
}

export interface ICollection<T extends IDocument = any> {
  find(selector?: any, opt?: { transform: (doc: any) => any }): Partial<T>[];
  findOne(selector?: any, opt?: { transform: (doc: any) => any }): Partial<T>;
  observe(handler:ICollectionObserverHandler):void
}
export interface ICollectionObserverHandler<T = any> {
  added: (id: string, data: T) => any;
  changed?: (id: string, fields: Partial<T>, removeFields: string[]) => any;
  removed?: (id: string) => any;
  error?: (err: any) => any;
  addedBefore?: (id: string, fields: any, before: any) => any;
  movedBefore?: (id: string, before: any) => any;
}
export interface IEventEmitter {
  maxListeners: number;
  emit(type, ...args): boolean;
  on(type, listener, prepend?: boolean);
  once(type, listener, prepend?: boolean): IEventEmitter;
  off(type, listener): IEventEmitter;
  listenerCount(type): number;
  eventNames(): string[];
}
export enum IDDPConnectionState {
  CLOSED = 0,
  CONNECTING = 1,
  CONNECTED = 2,
  READY = 3,
  FAIL = 4,
  CLOSING = 5,
  RECONNECTING = 6,
}
export interface IDDPConnection extends IEventEmitter {
  tlsOpts: any;
  autoReconnect: boolean;
  autoReconnectTimer: number;
  url: string;
  socketConstructor: SocketConstructor;
  ddpVersion: string;
  db: IMongo;
  socket: Socket;
  session: any;
  state: IDDPConnectionState;
  isSocketBusy: boolean;
  connect(url?: string, protos?: any, data?: any): void;
  close(): void;
  call(name, params, callback?: any, updatedCallback?: any): void;
  subscribe(name: string, params: any, callback?: any): string;
  unsubscribe(id: string): void;
}
