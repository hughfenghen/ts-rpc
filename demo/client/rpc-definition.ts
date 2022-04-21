/* eslint-disable */
export namespace RPCDemoNS {
    type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

    export interface APIReturnTypes {
        'User.getInfoById': UnwrapPromise<UserInfo>;
        'User.getUnreadMsg': UnwrapPromise<{ code: number, data: string[] }>;
    }

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
        getInfoById(id: string): UserInfo;
        getUnreadMsg(id: string): { code: number, data: string[] };
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
          "type": "object",
          "properties": {
            "code": {
              "type": "number"
            },
            "data": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "required": [
            "code",
            "data"
          ]
        }
      }
    ]
  }
];