export const filterServiceMockCode = `
/* eslint-disable */
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

export namespace RPCDemo1NS {
    export interface App {
        User1: User1;
        User2: User2;
    }

    export interface APIReturnTypes {
      'User1.getInfoById': UnwrapPromise<UserInfo>;
      'User1.getUnreadMsg': UnwrapPromise<string[]>;
      'User2.getInfoById': UnwrapPromise<UserInfo>;
      'User2.getUnreadMsg': UnwrapPromise<string[]>;
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

export type RPCDemo1 = RPCDemo1NS.App;

export namespace RPCDemo2NS {
    export interface App {
        User3: User3;
    }

    export interface UserInfo {
        name: string;
        age: number;
        avatar: string;
    }

    interface User3 {
        /**
         * method doc
         */
        getInfoById(id: string): Promise<UserInfo>;
        getUnreadMsg(id: string): Promise<string[]>;
    }
}

export type RPCDemo2 = RPCDemo2NS.App;
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
    name: 'User3',
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
