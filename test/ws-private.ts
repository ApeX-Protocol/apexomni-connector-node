import {ApexWsClient} from "../src";
import {WS_QA} from "../src/omni";
import {ApiKeyCredentials, IContents} from "../src/omni/interface";
import {omniUser} from "../src/mock";
import {size} from "viem";


(async () => {
  const apiKeyCredentials: ApiKeyCredentials = {
    key: omniUser.key,
    passphrase: omniUser.passphrase,
    secret: omniUser.secret,
  };
  const client = new ApexWsClient(WS_QA, apiKeyCredentials );
  client.subscribePrivateData((data) => {
    console.log('PrivateData:', data);
    if (data?.type?.includes("snapshot"))  {
        // this is all snapshot data
      console.log('this is snapshot data \n');
    } else if (data?.type?.includes("delta"))  {
        // this is delta incremental data
      console.log('this is delta data \n');
    }

    if (isIContents(data.contents)) {
      if (data?.type?.includes("snapshot") && size(data.contents.contractAccounts) > 0) {
        console.log('this is contract account data:', data.contents.contractAccounts[0]);
      }
      if (data?.type?.includes("snapshot") && size(data.contents.contractWallets) > 0) {
        console.log('this is contract Wallets data:', data.contents.contractWallets[0]);
      }
      if (data?.type?.includes("snapshot") && size(data.contents.spotAccounts) > 0) {
        console.log('this is spot Accounts data:', data.contents.spotAccounts[0]);
      }
      if (data?.type?.includes("snapshot") && size(data.contents.spotWallets) > 0) {
        console.log('this is spot Wallets data:', data.contents.spotWallets[0]);
      }
      if (data?.type?.includes("snapshot") && size(data.contents.transfers) > 0) {
        console.log('this is Not finished transfers data:', data.contents.transfers);
      }
      if (data?.type?.includes("snapshot") && size(data.contents.orders) > 0) {
        console.log('this is Not finished open orders data:', data.contents.orders);
      }
      if (data?.type?.includes("snapshot") && size(data.contents.positions) > 0) {
        console.log('this is open positions data:', data.contents.positions);
      }
      if (data?.type?.includes("snapshot") && size(data.contents.deleverages) > 0) {
        console.log('this is ADL deleverages warning data:', data.contents.deleverages);
      }

      if (data?.type?.includes("delta") && size(data.contents.positionClosedTransactions) > 0) {
        console.log('this is position Closed Transactions data:', data.contents.positionClosedTransactions);
      }
      if (data?.type?.includes("delta") && size(data.contents.orders) > 0) {
        console.log('this is open orders status change data:', data.contents.orders);
      }
      if (data?.type?.includes("delta") && size(data.contents.fills) > 0) {
        console.log('this is user trades data:', data.contents.fills);
      }
    }
  });
})();

export function isIContents(obj: any): obj is IContents {
  return (
      obj &&
      typeof obj === "object" &&
      Array.isArray(obj.contractAccounts) &&
      Array.isArray(obj.spotWallets) &&
      Array.isArray(obj.spotAccounts) &&
      Array.isArray(obj.orders) &&
      Array.isArray(obj.positions) &&
      Array.isArray(obj.contractWallets)
  );
}
