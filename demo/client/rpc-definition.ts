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
        id: string;
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
        ],
        "retSchema": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "age": {
              "type": "number"
            },
            "avatar": {
              "type": "string"
            }
          },
          "required": [
            "age",
            "avatar",
            "id",
            "name"
          ]
        }
      },
      {
        "name": "getUnreadMsg",
        "decorators": [
          "@RPCMethod()"
        ],
        "retSchema": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    ]
  }
];