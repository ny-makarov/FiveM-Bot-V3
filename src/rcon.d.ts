declare module "rcon" {
    export default class Rcon {
        constructor(host: string, port: number, password: string, options?: any);
        connect(): void;
        send(command: string): Promise<string>;
        disconnect(): void;
        on(event: string, listener: (...args: any[]) => void): this;
    }
}
