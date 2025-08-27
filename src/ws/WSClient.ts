import WebSocket from 'isomorphic-ws';
import crypto from 'crypto';
import {PRIVATE_REQUEST_PATH} from "../omni";
import {PrivateApi} from "../omni/PrivateApi";
import {ISO8601} from "../omni/interface";
import {Clock} from "../omni/tool/Clock";

interface WSClientCallbacks {
    onPublicConnect?: () => void;
    onPublicDisconnect?: () => void;
    onPrivateConnect?: () => void;
    onPrivateDisconnect?: () => void;
    onError?: (type: 'public' | 'private', error: Error) => void;
    onMaxReconnectReached?: (type: 'public' | 'private') => void;
}

interface WSClientOptions {
    endPoint?: string;
    publicUrl: string;
    privateUrl: string;
    apiKey?: string;
    passphrase?: string,
    secret?: string;
    heartbeatInterval?: number;
    maxReconnectAttempts?: number;
    debug?: boolean;
    callbacks?: WSClientCallbacks;
}

type ChannelHandler<T = any> = (data: T) => void;

export class WSClient {
    private publicUrl: string;
    private privateUrl: string;
    private apiKey?: string;
    private passphrase?: string;
    private secret?: string;
    private heartbeatInterval: number;
    private maxReconnectAttempts: number;
    private debug: boolean;

    private wsPublic?: WebSocket;
    private wsPrivate?: WebSocket;
    private publicReconnectAttempts = 0;
    private privateReconnectAttempts = 0;

    private publicHeartbeat?: NodeJS.Timeout;
    private privateHeartbeat?: NodeJS.Timeout;

    private publicSubscriptions: Map<string, ChannelHandler> = new Map();
    private privateSubscriptions: Map<string, ChannelHandler> = new Map();

    private callbacks: WSClientCallbacks;

    constructor(options: WSClientOptions) {
        this.publicUrl = options.publicUrl;
        this.privateUrl = options.privateUrl;
        this.apiKey = options.apiKey;
        this.passphrase = options.passphrase;
        this.secret = options.secret;
        this.heartbeatInterval = options.heartbeatInterval || 15000;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
        this.debug = options.debug || false;
        this.callbacks = options.callbacks || {};

        this.connectPublic();
        if (this.apiKey && this.secret) {
            this.connectPrivate();
        }
    }

    private log(...args: any[]) {
        if (this.debug) console.log('[WSClient]', ...args);
    }

    private connectPublic() {
        this.log('Connecting public WS...');
        this.wsPublic = new WebSocket(this.publicUrl + '&timestamp=' + Date.now());

        this.wsPublic.onopen = () => {
            this.log('Public WS connected');
            this.publicReconnectAttempts = 0;
            this.startHeartbeat('public');
            this.callbacks.onPublicConnect?.();

            this.publicSubscriptions.forEach((_, channel) => {
                this.sendPublic({ op: 'subscribe', args: [channel]  });
            });
        };

        this.wsPublic.onmessage = (msg) => this.handleMessage(msg, 'public');

        this.wsPublic.onclose = () => {
            this.log('Public WS disconnected');
            this.stopHeartbeat('public');
            this.callbacks.onPublicDisconnect?.();
            this.reconnect('public');
        };

        this.wsPublic.onerror = (err) => {
            this.log('Public WS error:', err);
            this.callbacks.onError?.('public', err as unknown as Error);
            this.wsPublic?.close();
        };
    }

    private connectPrivate() {
        this.log('Connecting private WS...');
        const isoTimestamp: ISO8601 = new Clock().getAdjustedIsoString();
        // const timestamp = Date.now();
        const privateUrl =  this.privateUrl + '&timestamp=' + new Date(isoTimestamp).getTime()
        this.log('Connecting private WS url ...' + privateUrl);
        this.wsPrivate = new WebSocket(privateUrl);

        this.wsPrivate.onopen = () => {
            this.log('Private WS connected');
            this.privateReconnectAttempts = 0;
            this.startHeartbeat('private');
            // this.authenticate();
            const channel = 'ws_zk_accounts_v3'
            const req = this.authenticate(channel, isoTimestamp)
            this.sendPrivate({ op: 'login', args: [req] });

            this.callbacks.onPrivateConnect?.();

/*            this.privateSubscriptions.forEach((_, channel) => {
                channel = 'ws_zk_accounts_v3'
                const req = this.authenticate(channel)
                this.sendPrivate({ op: 'login', args: [req] });
            });*/
        };

        this.wsPrivate.onmessage = (msg) => this.handleMessage(msg, 'private');

        this.wsPrivate.onclose = () => {
            this.log('Private WS disconnected');
            this.stopHeartbeat('private');
            this.callbacks.onPrivateDisconnect?.();
            this.reconnect('private');
        };

        this.wsPrivate.onerror = (err) => {
            this.log('Private WS error:', err);
            this.callbacks.onError?.('private', err as unknown as Error);
            this.wsPrivate?.close();
        };
    }

    private authenticate(channel: string, timeStamp:ISO8601 ) : string  {
        const signature = PrivateApi.sign(PRIVATE_REQUEST_PATH,'get',timeStamp,'',this.secret)

        const req = {
            'type': 'login',
            'topics': [channel],
            'httpMethod': 'GET',
            'requestPath': PRIVATE_REQUEST_PATH,
            'apiKey': this.apiKey,
            'passphrase': this.passphrase,
            'timestamp': new Date(timeStamp).getTime(),
            'signature': signature,
        }
        return JSON.stringify(req)
    }

    private startHeartbeat(type: 'public' | 'private') {
        const sendPing = () => {
            if (type === 'public') this.sendPublic({ op: 'ping' });
            else this.sendPrivate({ op: 'ping' });
        };

        if (type === 'public') {
            this.publicHeartbeat = setInterval(sendPing, this.heartbeatInterval);
        } else {
            this.privateHeartbeat = setInterval(sendPing, this.heartbeatInterval);
        }
    }

    private stopHeartbeat(type: 'public' | 'private') {
        if (type === 'public' && this.publicHeartbeat) clearInterval(this.publicHeartbeat);
        if (type === 'private' && this.privateHeartbeat) clearInterval(this.privateHeartbeat);
    }

    private reconnect(type: 'public' | 'private') {
        const attempts =
            type === 'public' ? ++this.publicReconnectAttempts : ++this.privateReconnectAttempts;

        if (attempts > this.maxReconnectAttempts) {
            this.callbacks.onMaxReconnectReached?.(type);
            this.log(`${type} WS max reconnect attempts reached.`);
            return;
        }

        const delay = Math.min(1000 * 2 ** attempts, 30000);
        this.log(`${type} WS reconnecting in ${delay}ms (attempt ${attempts})`);

        setTimeout(() => {
            if (type === 'public') this.connectPublic();
            else this.connectPrivate();
        }, delay);
    }

    private sendPublic(data: object) {
        if (this.wsPublic?.readyState === WebSocket.OPEN) {
            this.log('Public WS send data: ' + JSON.stringify(data));
            this.wsPublic.send(JSON.stringify(data));
        }
    }

    private sendPrivate(data: object) {
        if (this.wsPrivate?.readyState === WebSocket.OPEN) {
            this.log('private WS send data: ' + JSON.stringify(data));
            this.wsPrivate.send(JSON.stringify(data));
        }
    }

    subscribePublic<T = any>(channel: string, handler: ChannelHandler<T>) {
        if (!this.publicSubscriptions.has(channel)) {
            this.publicSubscriptions.set(channel, handler);
            this.sendPublic({ op: 'subscribe', args: [channel] });
        }
    }

    subscribePrivate<T = any>(handler: ChannelHandler<T>) {

        const channel = 'ws_zk_accounts_v3'
        // const req = this.authenticate(channel)

        if (!this.privateSubscriptions.has(channel)) {
            this.privateSubscriptions.set(channel, handler);
            // this.sendPrivate({ op: 'login', args: [req] });
        }
    }

    unsubscribePublic(channel: string) {
        if (this.publicSubscriptions.has(channel)) {
            this.publicSubscriptions.delete(channel);
            this.sendPublic({ op: 'unsubscribe', channel });
        }
    }

    unsubscribePrivate(channel: string) {
        if (this.privateSubscriptions.has(channel)) {
            this.privateSubscriptions.delete(channel);
            this.sendPrivate({ op: 'unsubscribe', channel });
        }
    }

    private static isPingMessage(message: WebSocket.MessageEvent): boolean {
        const data = JSON.parse(message.data.toString());
        return data.op === 'ping';
    }

    private static isAuthMessage(message: WebSocket.MessageEvent): boolean {
        const data = JSON.parse(message.data.toString());
        if (data.request)
            return  data.request.op === 'login'
    }

    private static isSubscriptionMessage(message: WebSocket.MessageEvent): boolean {
        const data = JSON.parse(message.data.toString());
        if (data.request)
            return  data.request.op === 'subscribe'
    }

    private handleMessage(msg: WebSocket.MessageEvent, type: 'public' | 'private') {
        this.log('handleMessage '+ type + ' WS...' + JSON.stringify(msg.data));
        try {
            if (WSClient.isPingMessage(msg)) {
                const timeStamp = Date.now();
                this.sendPublic({
                    op: 'pong',
                    args: [String(timeStamp)],
                });
                return;
            }

            if (WSClient.isAuthMessage(msg)) {
                const authData = JSON.parse(msg.data.toString());
                if (authData.success === 'true') {
                    this.log('Authorization successful.');
                }
                return;
            }

            if (WSClient.isSubscriptionMessage(msg)) {
                const subData = JSON.parse(msg.data.toString());
                if (subData.success === 'true') {
                    this.log('Subscription successful.');
                }
            }

            const data = JSON.parse(msg.data.toString());
            const channel = data.topic;

            if (channel) {
                const handler =
                    type === 'public'
                        ? this.publicSubscriptions.get(channel)
                        : this.privateSubscriptions.get(channel);
                if (handler) handler(data);
            } else {
                this.log(`${type.toUpperCase()} WS message:`, data);
            }
        } catch (e) {
            this.log(`${type.toUpperCase()} WS parse error:`, e);
        }
    }

    close() {
        this.wsPublic?.close();
        this.wsPrivate?.close();
        this.stopHeartbeat('public');
        this.stopHeartbeat('private');
    }
}
