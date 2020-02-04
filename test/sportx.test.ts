import { expect } from "chai";
import { Wallet } from "ethers";
import { parseUnits } from "ethers/utils";
import "mocha";
import moment from "moment";
import { INewOrder } from "../src";
import { Environments, TOKEN_ADDRESSES, Tokens } from "../src/constants";
import { ISportX, newSportX } from "../src/sportx";
import {
  convertFromAPIPercentageOdds,
  convertToAPIPercentageOdds,
  convertToTrueTokenAmount
} from "../src/utils/convert";

// tslint:disable no-string-literal

const TEST_MNEMONIC =
  "elegant execute say gain evil afford puppy upon amateur planet lunar pen";

describe("sportx", () => {
  let sportX: ISportX;
  const wallet = Wallet.fromMnemonic(TEST_MNEMONIC);
  const daiAddress = TOKEN_ADDRESSES[Tokens.DAI][Environments.RINKEBY];

  before("should initialize", async () => {
    sportX = await newSportX(
      Environments.RINKEBY,
      wallet.privateKey,
      process.env.PROVIDER_URL
    );
  });

  it("should get metadata", async () => {
    const metadata = await sportX.getMetadata();
    expect(metadata.executorAddress).to.exist;
  });

  it("should get leagues", async () => {
    const leagues = await sportX.getLeagues();
    expect(leagues.length).greaterThan(0);
  });

  it("should get sports", async () => {
    const sports = await sportX.getSports();
    expect(sports.length).greaterThan(0);
  });

  it("should get active markets", async () => {
    const activeMarkets = await sportX.getActiveMarkets();
    expect(activeMarkets.length).greaterThan(0);
  });

  it("should make a new order", async () => {
    const activeMarkets = await sportX.getActiveMarkets();
    const firstMarketHash = activeMarkets[0].marketHash;
    const newOrder: INewOrder = {
      marketHash: firstMarketHash,
      totalBetSize: convertToTrueTokenAmount(10).toString(),
      percentageOdds: convertToAPIPercentageOdds(0.5).toString(),
      expiry: moment()
        .add(1, "hour")
        .unix(),
      isMakerBettingOutcomeOne: true,
      baseToken: daiAddress
    };
    const response = await sportX.newOrder(newOrder);
    expect(response.status).to.equal("success");
  });

  it("should cancel an order", async () => {
    const activeMarkets = await sportX.getActiveMarkets();
    const firstMarketHash = activeMarkets[0].marketHash;
    const newOrder: INewOrder = {
      marketHash: firstMarketHash,
      totalBetSize: parseUnits("10", 18).toString(),
      percentageOdds: convertToAPIPercentageOdds(0.5).toString(),
      expiry: moment()
        .add(1, "hour")
        .unix(),
      isMakerBettingOutcomeOne: true,
      baseToken: daiAddress
    };
    const {
      data: { orders }
    } = await sportX.newOrder(newOrder);
    const response = await sportX.cancelOrder(orders, "Cancel Orders");
    expect(response.status).to.equal("success");
  });

  it("should convert from protocol percentage odds", () => {
    const odds = "88985727650227679586";
    const convertedOdds = convertFromAPIPercentageOdds(odds);
    expect(convertedOdds).to.equal(0.8898572765022768);
  });

  it("should get active orders for an address", async () => {
    const activeMarkets = await sportX.getActiveMarkets();
    const orders = await sportX.getOrders([activeMarkets[0].marketHash]);
    const maker = orders[0].maker;
    const activeOrders = await sportX.getOrders(undefined, maker);
    expect(Object.keys(activeOrders).length).greaterThan(0);
  });

  it("should get active orders for a market", async () => {
    const activeMarkets = await sportX.getActiveMarkets();
    const orders = await sportX.getOrders([activeMarkets[0].marketHash]);
    expect(orders.length).greaterThan(0);
  });

  it("should suggest orders", async () => {
    const activeMarkets = await sportX.getActiveMarkets();
    const suggestions = await sportX.suggestOrders(
      activeMarkets[10].marketHash,
      convertToTrueTokenAmount(10),
      false,
      wallet.address,
      daiAddress
    );
    expect(suggestions.status).to.equal("success");
  });

  it("should get pending bets", async () => {
    await sportX.getRecentPendingBets(wallet.address, daiAddress);
  });

  it("should get trades", async () => {
    const trades = await sportX.getTrades({});
    expect(trades.length).greaterThan(0);
  });

  it("should fill an order", async () => {
    const activeMarkets = await sportX.getActiveMarkets();
    const market = activeMarkets[10].marketHash;
    const orders = await sportX.getOrders([market]);
    const suggestions = await sportX.suggestOrders(
      market,
      convertToTrueTokenAmount(10),
      true,
      wallet.address,
      daiAddress
    );
    const ordersToFill = orders.filter(order =>
      suggestions.data.orderHashes.includes(order.orderHash)
    );
    const fill = await sportX.fillOrders(ordersToFill, [
      convertToTrueTokenAmount(10)
    ]);
    expect(fill.status).to.equal("success");
  });

  it("should subscribe to an account", async () => {
    const address = await wallet.getAddress();
    await sportX.subscribeActiveOrders(address);
  });

  it("should unsubscribe from an account", async () => {
    const address = await wallet.getAddress();
    await sportX.unsubscribeActiveOrders(address);
  });

  it("should meta approve DAI", async () => {
    await sportX.approveSportXContractsDai();
  });
});
