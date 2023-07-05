import * as ws from 'ws';
import { EventEmitter } from 'node:events';
export class CloudBit extends EventEmitter {
    constructor(device_id, socket) {
        super();
        this.inputValue = 0;
        this.device_id = device_id;
        this.socket = socket;
    }
    getInputValue() { return this.inputValue; }
    async setOutput(value) {
        return new Promise((resolve, reject) => {
            this.emit('output', value);
            if (this.socket.readyState == 1)
                resolve(this.socket.send(JSON.stringify({ type: 'output', value: value })));
            else
                reject('Socket is not open.');
        });
    }
    // Events
    /**
     * A function to listen to the events that the CloudBit client may emit.
     * Note: If you listen to the Heartbeat event, do NOT send anything over the Socket connection.
     * @param event Event to listen to. Should be `INPUT`, `OUTPUT`, or `Heartbeat`.
     * @param cb Event listener callback.
     */
    on(event, cb) {
        super.on(event, cb);
        return this;
    }
}
export class Server extends ws.Server {
    constructor(options, callback) {
        super(options, callback);
        this.cloudbits = new Set();
        this.on('connection', (socket, request) => {
            const device_id = new URL(socket.url).searchParams.get('device_id');
            if (device_id == null)
                return socket.close(4002);
            if (this.getCloudBitByDeviceId(device_id))
                return socket.close(4002);
            const cb = new CloudBit(device_id, socket);
            this.cloudbits.add(cb);
            setTimeout(() => socket.send(JSON.stringify({ type: 'Hello', heartbeat_interval: 30000 })), 3000);
        });
    }
    getCloudBitByDeviceId(deviceId) {
        var cloudbit = undefined;
        this.cloudbits.forEach((value) => {
            if (value.device_id == deviceId && cloudbit == undefined) {
                cloudbit = value;
            }
        });
        return cloudbit;
    }
}
