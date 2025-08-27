import { WSClient } from './WSClient';
import {PRIVATE_WSS, PUBLIC_WSS, WS_PROD} from "../omni";
import {ApiKeyCredentials} from "../omni/interface";

type ChannelHandler<T = any> = (data: T) => void;
export class ApexWsClient {
    public wsClient?: WSClient;
    constructor(url: string = WS_PROD, apiKeyCredentials: ApiKeyCredentials = null) {
        const endPoint = url.replace(/\/+$/, '');
        this.wsClient = new WSClient({
            endPoint,
            publicUrl: endPoint + PUBLIC_WSS,
            privateUrl: endPoint + PRIVATE_WSS,
            apiKey: apiKeyCredentials?apiKeyCredentials.key:'',
            passphrase: apiKeyCredentials?apiKeyCredentials.passphrase:'',
            secret: apiKeyCredentials?apiKeyCredentials.secret:'',
            debug: true,
            callbacks: {
                onPublicConnect: () => console.log('✅ Public WS connected'),
                onPublicDisconnect: () => console.log('❌ Public WS disconnected'),
                onPrivateConnect: () => console.log('✅ Private WS connected'),
                onPrivateDisconnect: () => console.log('❌ Private WS disconnected'),
                onError: (type, err) => console.error(`⚠ ${type} WS error:`, err.message),
                onMaxReconnectReached: (type) => console.error(`❌ ${type} reached max reconnect attempts`),
            },
        });
    }

    subscribeTicker<T = any>(symbol: string, handler: ChannelHandler<T>) {
        const arg = "instrumentInfo" + ".H." + symbol.replace("-", "");
        this.wsClient.subscribePublic(arg, handler);
    }

    subscribeDepth<T = any>(symbol: string, limit : number, handler: ChannelHandler<T>) {
        const arg = "orderBook" + limit + ".H."  + symbol.replace("-", "");
        this.wsClient.subscribePublic(arg, handler);
    }

    subscribeAllTicker<T = any>(handler: ChannelHandler<T>) {
        const arg = "instrumentInfo.all";
        this.wsClient.subscribePublic(arg, handler);
    }

    subscribeKlines<T = any>(symbol: string, interval : string, handler: ChannelHandler<T>) {
        const arg = "candle" + "." + interval + "."  + symbol.replace("-", "")
        this.wsClient.subscribePublic(arg, handler);
    }

    subscribeTrade<T = any>(symbol: string, handler: ChannelHandler<T>) {
        const arg = "recentlyTrade" + ".H." + symbol.replace("-", "");
        this.wsClient.subscribePublic(arg, handler);
    }

    subscribePrivateData<T = any>(handler: ChannelHandler<T>) {
        this.wsClient.subscribePrivate( handler);
    }

}


