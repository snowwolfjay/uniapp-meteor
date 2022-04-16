import { IDDPClient } from "../../hj-ddp/js_sdk";
export function useMeteorAccount(
  client: IDDPClient,
  opts?: { cacher?: any }
): {
  data: {
    state: 0 | 1 | 2;
    user?: {
      _id: string;
      profile?: {
        name: string;
        avatar: string;
        id: number;
      };
      role?: any;
    };
  };
  loginWithPassword(username: string, password: string): Promise<any>;
  logout(): void;
  createAccount(u: string, password: string): Promise<any>;
  onChange(cb: (user) => any): () => void;
};
