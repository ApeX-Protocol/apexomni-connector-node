import {ApexWsClient} from "../src";

(async () => {
  const client = new ApexWsClient();
  client.subscribeTicker('BTC-USDT', (data) => {
    console.log('Ticker:', data);
  });

  client.subscribeAllTicker((data) => {
    console.log('AllTicker:', data);
  });

  client.subscribeDepth('BTC-USDT', 25,(data) => {
    console.log('Depth:', data);
  });

  client.subscribeKlines('BTC-USDT', '1',(data) => {
    console.log('Klines:', data);
  });

  client.subscribeTrade('BTC-USDT', (data) => {
    console.log('Trade:', data);
  });
})();

