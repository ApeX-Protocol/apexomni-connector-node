
import { omniUser } from '../src/mock';

import BigNumber from 'bignumber.js';
import {
  ApiKeyCredentials,
  CreateOrderOptions,
  OrderSide,
  OrderType,
} from '../src/omni/interface';
import { Trace } from '../src/omni/tool/Tool';
import { ApexClient, OMNI_QA } from '../src';
import {numberToBytes} from "viem";

describe('Omni createOrder Api Example', () => {
  let apexClient: ApexClient.omni;
  const env = OMNI_QA

  before(async () => {
    apexClient = new ApexClient.omni(env);
    const apiKeyCredentials: ApiKeyCredentials = {
      key: omniUser.key,
      passphrase: omniUser.passphrase,
      secret: omniUser.secret,
    };
    const seed: string = omniUser.seed;
    await apexClient.init(apiKeyCredentials, seed);
  });

  it('GET Open Orders', async () => {
    const  orders  = await apexClient.privateApi.openOrders();
    Trace.print(orders);
  });

  it('GET Orders include position Orders', async () => {
    const  orders  = await apexClient.privateApi.openAllOrders(true);
    Trace.print(orders);
  });

  it('POST Create Limit Orders', async () => {
    const symbol = `BTC-USDT`;
    const price = '100000';
    const size = '0.01';
    const baseCoinRealPrecision = apexClient?.symbols?.[symbol]?.baseCoinRealPrecision;
    const takerFeeRate = apexClient.account.contractAccount.takerFeeRate;
    const makerFeeRate = apexClient.account.contractAccount.makerFeeRate;

    const limitFee = new BigNumber(price)
        .multipliedBy(takerFeeRate || '0')
        .multipliedBy(size)
        .toFixed(baseCoinRealPrecision, BigNumber.ROUND_UP);

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
      expiration: Math.floor(
          Date.now()  + 30 * 24 * 60 * 60 * 1000
      ),

    } as CreateOrderOptions;

    const result = await apexClient.privateApi.createOrder(apiOrder);
    Trace.print(result);
  });

  it('POST Create Market Orders', async () => {
    const symbol = `BTC-USDT`;
    const price = '100000';
    const size = '0.01';
    const baseCoinRealPrecision = apexClient?.symbols?.[symbol]?.baseCoinRealPrecision;
    const takerFeeRate = apexClient.account.contractAccount.takerFeeRate;
    const makerFeeRate = apexClient.account.contractAccount.makerFeeRate;

    const limitFee = new BigNumber(price)
        .multipliedBy(takerFeeRate || '0')
        .multipliedBy(size)
        .toFixed(baseCoinRealPrecision, BigNumber.ROUND_UP);

    const apiOrder = {
      pairId: apexClient.symbols[symbol]?.l2PairId,
      makerFeeRate,
      takerFeeRate,
      symbol,
      side: OrderSide.BUY,
      type: 'MARKET',
      size,
      price,
      limitFee,
      expiration: Math.floor(
          Date.now()  + 30 * 24 * 60 * 60 * 1000
      ),

    } as CreateOrderOptions;

    const result = await apexClient.privateApi.createOrder(apiOrder);
    Trace.print(result);
  });

  it('POST Create trigger TAKE_PROFIT_LIMIT conditional Orders', async () => {
    const symbol = `BTC-USDT`;
    const price = '100000';
    const size = '0.01';
    const triggerPrice = Number(parseFloat(price) * parseFloat('1.05')).toFixed(apexClient?.symbols?.[symbol]?.pricePrecision);

    const baseCoinRealPrecision = apexClient?.symbols?.[symbol]?.baseCoinRealPrecision;
    const takerFeeRate = apexClient.account.contractAccount.takerFeeRate;
    const makerFeeRate = apexClient.account.contractAccount.makerFeeRate;

    const limitFee = new BigNumber(price)
        .multipliedBy(takerFeeRate || '0')
        .multipliedBy(size)
        .toFixed(baseCoinRealPrecision, BigNumber.ROUND_UP);

    const apiOrder = {
      pairId: apexClient.symbols[symbol]?.l2PairId,
      makerFeeRate,
      takerFeeRate,
      symbol,
      side: OrderSide.BUY,
      type: 'TAKE_PROFIT_LIMIT',
      size,
      price,
      limitFee,
      timeInForce: 'GOOD_TIL_CANCEL',
      expiration: Math.floor(
          Date.now()  + 30 * 24 * 60 * 60 * 1000
      ),
      triggerPrice,
      triggerPriceType: 'INDEX',
    } as CreateOrderOptions;

    const result = await apexClient.privateApi.createOrder(apiOrder);
    Trace.print(result);
  });

  it('POST Create trigger STOP Market conditional Orders', async () => {
    const symbol = `BTC-USDT`;
    const price = '100000';
    const size = '0.01';
    const triggerPrice = Number(parseFloat(price) * parseFloat('1.1')).toFixed(apexClient?.symbols?.[symbol]?.pricePrecision);
    const baseCoinRealPrecision = apexClient?.symbols?.[symbol]?.baseCoinRealPrecision;
    const takerFeeRate = apexClient.account.contractAccount.takerFeeRate;
    const makerFeeRate = apexClient.account.contractAccount.makerFeeRate;

    const limitFee = new BigNumber(price)
        .multipliedBy(takerFeeRate || '0')
        .multipliedBy(size)
        .toFixed(baseCoinRealPrecision, BigNumber.ROUND_UP);

    const apiOrder = {
      pairId: apexClient.symbols[symbol]?.l2PairId,
      makerFeeRate,
      takerFeeRate,
      symbol,
      side: OrderSide.SELL,
      type: 'STOP_MARKET',
      size,
      price,
      limitFee,
      reduceOnly: true,
      timeInForce: 'GOOD_TIL_CANCEL',
      expiration: Math.floor(
          Date.now()  + 30 * 24 * 60 * 60 * 1000
      ),
      triggerPrice,
      triggerPriceType: 'INDEX',
    } as CreateOrderOptions;

    const result = await apexClient.privateApi.createOrder(apiOrder);
    Trace.print(result);
  });

  it('POST Create position TAKE_PROFIT MARKET Orders', async () => {
    const symbol = `BTC-USDT`;
    const price = '150000';
    const size = '0.01';
    const baseCoinRealPrecision = apexClient?.symbols?.[symbol]?.baseCoinRealPrecision;
    const takerFeeRate = apexClient.account.contractAccount.takerFeeRate;
    const makerFeeRate = apexClient.account.contractAccount.makerFeeRate;

    const limitFee = new BigNumber(price)
      .multipliedBy(takerFeeRate || '0')
      .multipliedBy(size)
      .toFixed(baseCoinRealPrecision, BigNumber.ROUND_UP);

    const apiOrder = {
      pairId: apexClient.symbols[symbol]?.l2PairId,
      makerFeeRate,
      takerFeeRate,
      symbol,
      side: OrderSide.BUY,
      type: 'TAKE_PROFIT_MARKET',
      size,
      price,
      limitFee,
      reduceOnly: true,
      timeInForce: 'GOOD_TIL_CANCEL',
      expiration: Math.floor(
        Date.now()  + 30 * 24 * 60 * 60 * 1000
      ),
      triggerPrice: price,
      isPositionTpsl: true,
      triggerPriceType: 'INDEX',
    } as CreateOrderOptions;

    const result = await apexClient.privateApi.createOrder(apiOrder);
    Trace.print(result);
  });

  it('POST Create position STOP MARKET Orders', async () => {
    const symbol = `BTC-USDT`;
    const price = '100000';
    const size = '0.01';
    const baseCoinRealPrecision = apexClient?.symbols?.[symbol]?.baseCoinRealPrecision;
    const takerFeeRate = apexClient.account.contractAccount.takerFeeRate;
    const makerFeeRate = apexClient.account.contractAccount.makerFeeRate;

    const limitFee = new BigNumber(price)
        .multipliedBy(takerFeeRate || '0')
        .multipliedBy(size)
        .toFixed(baseCoinRealPrecision, BigNumber.ROUND_UP);

    const apiOrder = {
      pairId: apexClient.symbols[symbol]?.l2PairId,
      makerFeeRate,
      takerFeeRate,
      symbol,
      side: OrderSide.SELL,
      type: 'STOP_MARKET',
      size,
      price,
      limitFee,
      reduceOnly: true,
      timeInForce: 'GOOD_TIL_CANCEL',
      expiration: Math.floor(
          Date.now()  + 30 * 24 * 60 * 60 * 1000
      ),
      triggerPrice: price,
      isPositionTpsl: true,
      triggerPriceType: 'INDEX',
    } as CreateOrderOptions;

    const result = await apexClient.privateApi.createOrder(apiOrder);
    Trace.print(result);
  });

  it('POST Create TPSL Orders', async () => {
    const symbol = `ETH-USDT`;
    const price = '3000';
    const slPrice = Number(parseFloat(price) * parseFloat('0.9')).toFixed(apexClient?.symbols?.[symbol]?.pricePrecision);
    const slTriggerPrice = Number(parseFloat(slPrice) * parseFloat('1.05')).toFixed(apexClient?.symbols?.[symbol]?.pricePrecision);
    const tpPrice = Number(parseFloat(price) * parseFloat('1.1')).toFixed(apexClient?.symbols?.[symbol]?.pricePrecision);
    const tpTriggerPrice = Number(parseFloat(tpPrice) * parseFloat('1.05')).toFixed(apexClient?.symbols?.[symbol]?.pricePrecision);
    const size = '0.01';
    const baseCoinRealPrecision = apexClient?.symbols?.[symbol]?.baseCoinRealPrecision;
    const takerFeeRate = apexClient.account.contractAccount.takerFeeRate;
    const makerFeeRate = apexClient.account.contractAccount.makerFeeRate;

    const limitFee = new BigNumber(price)
        .multipliedBy(takerFeeRate || '0')
        .multipliedBy(size)
        .toFixed(baseCoinRealPrecision, BigNumber.ROUND_UP);
    const slLimitFee = new BigNumber(slPrice)
        .multipliedBy(takerFeeRate || '0')
        .multipliedBy(size)
        .toFixed(baseCoinRealPrecision, BigNumber.ROUND_UP);
    const tpLimitFee = new BigNumber(tpPrice)
        .multipliedBy(takerFeeRate || '0')
        .multipliedBy(size)
        .toFixed(baseCoinRealPrecision, BigNumber.ROUND_UP);

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
      expiration: Math.floor(
          Date.now()  + 30 * 24 * 60 * 60 * 1000
      ),
      isOpenTpslOrder: true,
      isSetOpenSl:true,
      slPrice,
      slSide:"SELL",
      slSize: size,
      slLimitFee,
      slTriggerPrice,
      isSetOpenTp:true,
      tpPrice,
      tpSide:"SELL",
      tpSize: size,
      tpTriggerPrice,
      tpLimitFee

    } as CreateOrderOptions;

    const result = await apexClient.privateApi.createOrder(apiOrder);
    Trace.print(result);
  });


});
