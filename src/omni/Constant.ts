import { ApiKeyCredentials } from "./interface";
import { ZkLinkSigner } from "../ZKProxy";
import { ApiTool } from "./tool/ApiTool";
import { Clock } from "./tool/Clock";
import { ApexClientOmni } from "./ApexClient";

export class ClientConfig {
  public apiKeyCredentials: ApiKeyCredentials;
  public networkId: number;
  public accountId: string;
  public zkAccountId: string;
  public signer: ZkLinkSigner;
  public clock: Clock;
  public apiTool: ApiTool;

  public client: ApexClientOmni
}

export class ENV {
  public clock: Clock;
  url: string;
  networkId: number;
  isProd: boolean;
  registerChainId: number;

  constructor(url: string, networkId: number) {
    this.url = url;
    this.networkId = networkId;
    this.isProd = +networkId === 1;
    this.registerChainId = +networkId === 1 ? 1 : 5

  }
}

export const PROD = new ENV('https://omni.apex.exchange', 1);

export const QA = new ENV('https://qa.omni.apex.exchange', 5);

export const WS_PROD = 'wss://quote.omni.apex.exchange'
export const WS_QA = 'wss://qa-quote.omni.apex.exchange'

export const PRIVATE_REQUEST_PATH = '/ws/accounts'
export const PRIVATE_WSS = "/realtime_private?v=2"
export const PUBLIC_WSS = "/realtime_public?v=2"
