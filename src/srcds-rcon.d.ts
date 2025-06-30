declare module 'srcds-rcon' {
    interface RconOptions {
        host: string;
        port: number;
        password: string;
        timeout?: number;
    }

    interface Rcon {
        connect(): Promise<void>;
        disconnect(): void;
        command(command: string): Promise<string>;
    }

    const Rcon: (options: RconOptions) => Rcon;
    export = Rcon;
}