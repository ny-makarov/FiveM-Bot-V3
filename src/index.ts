import { createClient } from "./discord/base";
import { log } from "./settings";

const client = createClient();
client.start();

process.on("uncaughtException", log.error);
process.on("unhandledRejection", log.error);

import * as udp from 'dgram';
import { Buffer } from 'buffer';

const asCommandBuffer = (cmd: string, pwd: string): Buffer => {
    return Buffer.concat([
        Buffer.alloc(4, 0xff), 
        Buffer.from([
            'rcon',
            pwd,
            cmd
        ].join(' '))
    ]);
};

const asHumanReadableString = (buf: Buffer): string => {
    return buf.slice(4).toString().replace('\n', '');
};

class Rcon {
    private host: string;
    private port: number;
    private password: string;
    private sock: udp.Socket;
    private timeout: number;

    constructor(host: string, port: number, password: string) {
        this.host = host;
        this.port = port;
        this.password = password;

        this.sock = udp.createSocket('udp4');
        this.timeout = 1500;
    }

    public command(command: string): Promise<RconResponse> {
        return new Promise((resolve, reject) => {
            const buffer = asCommandBuffer(command, this.password);

            // Usando asserção de tipo para Uint8Array
            this.sock.send(buffer as Uint8Array, this.port, this.host, (err) => {
                if (err) {
                    reject('failed to send bytes');
                }
            });

            this.sock.once('message', (rec) => {
                resolve(new RconResponse(rec));
            });

            setTimeout(() => reject('sending attempt timed out'), this.timeout);
        });
    }
}

class RconResponse {
    private message: string;

    constructor(raw: Buffer) {
        this.message = asHumanReadableString(raw);
    }

    public trimColorCodes(): RconResponse {
        this.message = this.message.replace(/(\^\d)+/gm, '');
        return this;
    }

    public toString(): string {
        return this.message;
    }

    public get(): string {
        this.trimColorCodes();
        return this.message.substring(6); // 'print '
    }
}

export default Rcon;