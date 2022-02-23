export const filterServiceMockCode = `
/* eslint-disable */
export namespace RPCDemoNS1 {
    export interface App {
        User1: User1;
        User2: User2;
    }

    export interface UserInfo {
        name: string;
        age: number;
        avatar: string;
    }

    interface User1 {
        /**
         * method doc
         */
        getInfoById(id: string): Promise<UserInfo>;
        getUnreadMsg(id: string): Promise<string[]>;
    }

    interface User2 {
        /**
         * method doc
         */
        getInfoById(id: string): Promise<UserInfo>;
        getUnreadMsg(id: string): Promise<string[]>;
    }
}

export type RPCDemo1 = RPCDemoNS1.App;

export namespace RPCDemoNS2 {
    export interface App {
        User2: User2;
    }

    export interface UserInfo {
        name: string;
        age: number;
        avatar: string;
    }

    interface User2 {
        /**
         * method doc
         */
        getInfoById(id: string): Promise<UserInfo>;
        getUnreadMsg(id: string): Promise<string[]>;
    }
}

export type RPCDemo2 = RPCDemoNS2.App;
`

export const filterServiceMockMeta = {
  RPCDemoMeta1: [{
    name: 'User1',
    path: 'server/user-controller.ts',
    methods: [{
      name: 'getInfoById',
      decorators: [
        '@RPCMethod()'
      ]
    }, {
      name: 'getUnreadMsg',
      decorators: [
        '@RPCMethod()'
      ]
    }]
  }, {
    name: 'User2',
    path: 'server/user-controller.ts',
    methods: [{
      name: 'getInfoById',
      decorators: [
        '@RPCMethod()'
      ]
    }, {
      name: 'getUnreadMsg',
      decorators: [
        '@RPCMethod()'
      ]
    }]
  }],
  RPCDemoMeta2: [{
    name: 'User2',
    path: 'server/user-controller.ts',
    methods: [{
      name: 'getInfoById',
      decorators: [
        '@RPCMethod()'
      ]
    }, {
      name: 'getUnreadMsg',
      decorators: [
        '@RPCMethod()'
      ]
    }]
  }]
}
