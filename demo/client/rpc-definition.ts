/* eslint-disable */
export namespace RPCDemoNS {
    export interface App {
        User: User;
    }

    /**
     * service doc
     */
    interface User {
        /**
         * method doc
         */
        getInfoById(id: string): Promise<UserInfo>;
        getUnreadMsg(id: string): Promise<string[]>;
    }

    export interface UserInfo {
        name: string;
        age: number;
        avatar: string;
    }
}

export type RPCDemo = RPCDemoNS.App;

export const RPCDemoMeta = [
  {
    "name": "User",
    "path": "server/user-controller.ts",
    "methods": [
      {
        "name": "getInfoById",
        "decorators": [
          "@Post()",
          "@RPCMethod()"
        ]
      },
      {
        "name": "getUnreadMsg",
        "decorators": [
          "@RPCMethod()"
        ]
      }
    ]
  }
];