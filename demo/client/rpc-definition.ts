/* eslint-disable */

interface App {
    User: User;
}

interface UserInfo {
    name: string;
    age: number;
    avatar: string;
}

export default App;

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
