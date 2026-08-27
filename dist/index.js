"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const base_1 = require("./discord/base");
const settings_1 = require("./settings");
const client = (0, base_1.createClient)();
client.start();
process.on("uncaughtException", settings_1.log.error);
process.on("unhandledRejection", settings_1.log.error);
const udp = tslib_1.__importStar(require("dgram"));
const buffer_1 = require("buffer");
const asCommandBuffer = (cmd, pwd) => {
    return buffer_1.Buffer.concat([
        buffer_1.Buffer.alloc(4, 0xff),
        buffer_1.Buffer.from([
            'rcon',
            pwd,
            cmd
        ].join(' '))
    ]);
};
const asHumanReadableString = (buf) => {
    return buf.subarray(4).toString().replace('\n', '');
};
class Rcon {
    host;
    port;
    password;
    sock;
    timeout;
    constructor(host, port, password) {
        this.host = host;
        this.port = port;
        this.password = password;
        this.sock = udp.createSocket('udp4');
        this.timeout = 1500;
    }
    command(command) {
        return new Promise((resolve, reject) => {
            const buffer = asCommandBuffer(command, this.password);
            this.sock.send(buffer, this.port, this.host, (err) => {
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
    message;
    constructor(raw) {
        this.message = asHumanReadableString(raw);
    }
    trimColorCodes() {
        this.message = this.message.replace(/(\^\d)+/gm, '');
        return this;
    }
    toString() {
        return this.message;
    }
    get() {
        this.trimColorCodes();
        return this.message.substring(6);
    }
}
exports.default = Rcon;
