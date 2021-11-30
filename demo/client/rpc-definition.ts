
/* eslint-disable */
namespace RPCDemoNS {
    export interface App {
        User: User;
    }

    interface UserInfo {
        name: string;
        age: number;
        avatar: string;
    }

    /**
     * service doc
     */
    interface User {
        /**
         * method doc
         */
        getInfoById(id: string): Promise<UserInfo>;
        getUnreadMsg(id: string): Promise<number[]>;
    }
}

export type RPCDemo = RPCDemoNS.App;
