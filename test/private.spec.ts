
import { omniUser } from '../src/mock';

import BigNumber from 'bignumber.js';
import {
  ApiKeyCredentials,
  CreateOrderOptions,
  OrderSide,
  OrderType,
} from '../src/omni/interface';
import { Trace } from '../src/omni/tool/Tool';
import { ApexClient, OMNI_QA, OMNI_PROD } from '../src';
import {numberToBytes} from "viem";

describe('Omni Private Api Example', () => {
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

  it('GET Trade History', async () => {
    const { orders } = await apexClient.privateApi.tradeHistory(`BTC-USDT`, 'OPEN');
    Trace.print(orders);
  });

  it('GET Open Position ', async () => {
    const  account  = await apexClient.privateApi.getAccount(apexClient.clientConfig?.accountId, apexClient.user?.ethereumAddress);
    const positions = account?.positions
    Trace.print(positions);
  });

  it('Get Worst Price', async () => {
    const res = await apexClient.privateApi.getWorstPrice('BTC-USDT', '0.01', 'BUY').catch((error) => {
      console.log('error', error);
    });
    Trace.print(res);
  });

  it('POST Creating Orders', async () => {
    const symbol = `BTC-USDT`;
    const price = '100000';
    const size = '0.1';
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
      timeInForce: 'GOOD_TIL_CANCEL',
      expiration: Math.floor(
        Date.now()  + 30 * 24 * 60 * 60 * 1000
      ),

    } as CreateOrderOptions;

    const result = await apexClient.privateApi.createOrder(apiOrder);
    Trace.print(result);
  });

  it('GET Open Orders', async () => {
    const  orders  = await apexClient.privateApi.openOrders();
    Trace.print(orders);
  });

  it('GET Orders include position Orders', async () => {
    const  orders  = await apexClient.privateApi.openAllOrders(true);
    Trace.print(orders);
  });

  it('GET Order Fills', async () => {
    const { orders } = await apexClient.privateApi.historyOrders();
    const orderId = orders?.[0]?.id;
    if (!orderId) {
      return;
    }
    const fills = await apexClient.privateApi.orderFills({ orderId, limit: 1 });
    Trace.print(fills);
  });

  it('POST Cancel Orders By Client Order Ids', async () => {
    const orders = await apexClient.privateApi.openOrders();
    const clientOrderIds = orders
      ?.map((order) => order.clientOrderId || order.clientId)
      .filter((id) => id);
    if (!clientOrderIds?.length) {
      return;
    }
    const result = await apexClient.privateApi.cancelOrderByClientOrderIds(clientOrderIds.slice(0, 1));
    Trace.print(result);
  });

  it('POST Cancel Orders', async () => {
    const orders = await apexClient.privateApi.openOrders();
    const orderIds = orders?.map((order) => order.id).filter((id) => id);
    if (!orderIds?.length) {
      return;
    }
    const result = await apexClient.privateApi.cancelOrders(orderIds.slice(0, 1));
    Trace.print(result);
  });

  it('POST Cancel all Open Orders', async () => {
    const symbol = `BTC-USDT`;
    await apexClient.privateApi.cancelAllOrder(symbol);
  });

  it('GET All Order History', async () => {
    const { orders } = await apexClient.privateApi.historyOrders();
    Trace.print(orders);
  });

  it('POST Cancel Order', async () => {
    const orderId = '744192949182529884';
    const result = await apexClient.privateApi.cancelOrder(orderId);
    Trace.print(result);
  });

  it('GET Funding Rate', async () => {
    const { fundingValues, totalSize } = await apexClient.privateApi.fundingRate();
    Trace.print(fundingValues, totalSize);
  });

  it('GET User Historial Profit and Loss', async () => {
    const { historicalPnl, totalSize } = await apexClient.privateApi.historicalPNL();
    Trace.print(historicalPnl, totalSize);
  });

  it("GET Yesterday's Profit & Loss", async () => {
    const yesterdayPNL = await apexClient.privateApi.yesterdayPNL();
    Trace.print(yesterdayPNL);
  });

  it('GET Account Balance', async () => {
    const accountBalance = await apexClient.privateApi.accountBalance();
    Trace.print(accountBalance);
  });

  it('GET Get Order', async () => {
    const orderId = "744192949182529884"
    const order = await apexClient.privateApi.getOrder(orderId);
    Trace.print(order);
  });

  it('GET Get Client Order', async () => {
    const clientOrderId = "apexomni-634283468140839001-1744471003321-775651"
    const order = await apexClient.privateApi.getOrderByClientOrderId(clientOrderId);
    Trace.print(order);
  });

  it('POST Modify User', async () => {
    const res = await apexClient.privateApi.modifyUser({ isSharingUsername: true }).catch((error) => {
      console.log('error', error);
    });
    Trace.print(res);
  });

  it('GET Transfers', async () => {
    const res = await apexClient.privateApi.transfers({ limit: 1, page: 0, subAccountId: '0' });
    Trace.print(res);
  });

  it('GET Transfer', async () => {
    const listRes = await apexClient.privateApi.transfers({ limit: 1, page: 0, subAccountId: '0' });
    const ids = listRes?.transfers?.[0]?.id || listRes?.data?.transfers?.[0]?.id;
    if (!ids) {
      return;
    }
    const res = await apexClient.privateApi.transfer({ ids });
    Trace.print(res);
  });

  it('GET Contract Transfers', async () => {
    const res = await apexClient.privateApi.contractTransfers({ limit: 1, page: 0 });
    Trace.print(res);
  });

  it('GET Contract Transfer', async () => {
    const listRes = await apexClient.privateApi.contractTransfers({ limit: 1, page: 0 });
    const ids = listRes?.transfers?.[0]?.id || listRes?.data?.transfers?.[0]?.id;
    if (!ids) {
      return;
    }
    const res = await apexClient.privateApi.contractTransfer({ ids });
    Trace.print(res);
  });

  it('GET Withdraw List', async () => {
    const res = await apexClient.privateApi.withdrawList({ limit: 1, page: 0 }).catch((error) => {
      console.log('error', error);
    });
    Trace.print(res);
  });

  it('GET Contract Transfer Limit', async () => {
    const res = await apexClient.privateApi.contractTransferLimit({ token: 'USDT' });
    Trace.print(res);
  });

  it('GET Withdraw Fee', async () => {
    const res = await apexClient.privateApi.withdrawFee({});
    Trace.print(res);
  });

  it('GET Withdraws By Time And Status', async () => {
    const res = await apexClient.privateApi.withdrawsByTimeAndStatus({
      limit: 1,
      page: 0,
      client_time: Math.floor(Date.now() / 1000),
    }).catch((error) => {
      // QA currently returns INVALID_CLIENT_TIME regardless of sent value.
      if (error?.msg?.includes('invalid client_time')) {
        console.log('skip due to backend validation issue:', error?.msg);
        return null;
      }
      throw error;
    });
    Trace.print(res);
  });

  it('GET History Value', async () => {
    const res = await apexClient.privateApi.historyValue({ limit: 1, page: 0 });
    Trace.print(res);
  });

  it('Set Symbol trade Leverage ratio', async () => {
    await apexClient.privateApi.setInitialMarginRate('BTC-USDT','0.1');
  });


});
