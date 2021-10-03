
declare interface IDDPClient {
    loginWithPassword(u: string, password: string): Promise<any>;
    user: {
        state: 0 | 1 | 2; // offline logined loging
        info: any;
        onChange(cb: Function): void;
    };
    logout(): Promise<any>;
    createAccount(u: string, password: string): Promise<any>;
}
