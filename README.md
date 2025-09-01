
# Installation

```
yarn add apexomni-connector-node
npm install apexomni-connector-node
```


# Environment

```javascript
// QA
let apexClient:ApexClient = new ApexClient.omni(OMNI_QA);

// PROD
let apexClient:ApexClient = new ApexClient.omni(OMNI);
```


# Public Api Example

Please refer to [public api](test/public.spec.ts)

```typescript
let apexClient = new ApexClient.omni(OMNI);
console.log(await apexClient.publicApi.time())
console.log(await apexClient.publicApi.symbols())
console.log(await apexClient.publicApi.depth('BTCUSDT'))
console.log(await apexClient.publicApi.trades('BTCUSDT'))
console.log(await apexClient.publicApi.klines('BTCUSDT', '1'))
console.log(await apexClient.publicApi.tickers('BTCUSDT'))
console.log(await apexClient.publicApi.historyFunding('BTC-USDT'))
console.log(await apexClient.publicApi.checkUserExist('0x0000000000000000000000000000000000000000'))   
```


# Private Api Example

Please refer to [private api](test/private.spec.ts)

```typescript
let apexClient = new ApexClient.omni(OMNI);
const apiKeyCredentials: ApiKeyCredentials = {
    key: 'api key',
    passphrase: ' passphrase ',
    secret: ' secret',
};
const seed: string = "your omnikey";
await apexClient.init(apiKeyCredentials, seed);

// 'GET Trade History'
const { orders } = await apexClient.privateApi.tradeHistory(`BTC-USDT`, 'OPEN');
    
//'GET Open Position '
const  account  = await apexClient.privateApi.getAccount(apexClient.clientConfig?.accountId, apexClient.user?.ethereumAddress);
const positions = account?.positions


```

Please refer to [create_order demo](test/createOrder.spec.ts)

```typescript
let apexClient = new ApexClient.omni(OMNI);
const apiKeyCredentials: ApiKeyCredentials = {
    key: 'api key',
    passphrase: ' passphrase ',
    secret: ' secret',
};
const seed: string = "your omnikey";
await apexClient.init(apiKeyCredentials, seed);

// 'POST Create Limit Orders'
    const symbol = `BTC-USDT`;
    const price = '100000';
    const size = '0.01';
    const baseCoinRealPrecision = apexClient?.symbols?.[symbol]?.baseCoinRealPrecision;
    const takerFeeRate = apexClient.account.contractAccount.takerFeeRate;
    const makerFeeRate = apexClient.account.contractAccount.makerFeeRate;

    const limitFee = new BigNumber(price)
        .multipliedBy(takerFeeRate || '0')
        .multipliedBy(size)
        .toFixed(6, BigNumber.ROUND_UP);

    const apiOrder = {
        pairId: apexClient.symbols[symbol]?.l2PairId,
        makerFeeRate,
        takerFeeRate,
        symbol,
        side: OrderSide.BUY,
        type: 'LIMIT',
        size,
        price,
        limitFee,
        timeInForce: 'GOOD_TIL_CANCEL',
    } as CreateOrderOptions;

    const result = await apexClient.privateApi.createOrder(apiOrder);



```

# Public Websocket Api Example

Please refer to [ws-public api](test/ws-public.ts)

```typescript
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
```

# Private Websocket Api Example

Please refer to [ws-private api](test/ws-private.ts)

```typescript
const apiKeyCredentials: ApiKeyCredentials = {
    key: omniUser.key,
    passphrase: omniUser.passphrase,
    secret: omniUser.secret,
};
const client = new ApexWsClient(WS_PROD, apiKeyCredentials );
client.subscribePrivateData((data) => {
    console.log('PrivateData:', data);
});
```
