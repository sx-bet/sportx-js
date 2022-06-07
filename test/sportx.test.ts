import { JsonRpcProvider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";
import { expect } from "chai";
import "mocha";
import { INewOrder, IPendingBetsRequest } from "../src";
import {
  DEFAULT_RPC_URLS,
  Environments,
  TOKEN_ADDRESSES,
  Tokens,
  CHAIN_IDS,
  Networks,
} from "../src/constants";
import { ISportX, newSportX } from "../src/sportx";
import {
  convertFromAPIPercentageOdds,
  convertToAPIPercentageOdds,
  convertToTrueTokenAmount,
} from "../src/utils/convert";
import { getNetwork } from "../src/utils/networks";

// tslint:disable no-string-literal
const TEST_MNEMONIC =
  process.env.TEST_MNEMONIC ||
  "elegant execute say gain evil afford puppy upon amateur planet lunar pen";

if (!process.env.ENVIRONMENT) {
  throw new Error(`ENVIRONMENT env var not defined`);
}

const testMarketHash =
  process.env.MARKET_HASH ||
  "0x994c4b801a886ddab9e6c42abba515539f55c852595108f06979cdf67bac3475"; // CHANGE THIS TO MATCH A REAL MARKET

const testSportXeventId = process.env.SPORTX_EVENT_ID || "L8137640";

describe("sportx", () => {
  let sportX: ISportX;
  const env: Environments = process.env.ENVIRONMENT as Environments;
  const provider = new StaticJsonRpcProvider(
    DEFAULT_RPC_URLS[env],
    CHAIN_IDS[Networks.SX_TORONTO]
  );
  const wallet = Wallet.fromMnemonic(TEST_MNEMONIC).connect(provider);

  before("should initialize", async () => {
    sportX = await newSportX({
      env,
      customSidechainProviderUrl: process.env.SIDE_CHAIN_PROVIDER_URL,
      privateKey: wallet.privateKey,
      apiUrl: process.env.API_URL,
      apiKey: process.env.API_KEY,
    });
    await sportX.approveSportXContracts(
      TOKEN_ADDRESSES[getNetwork(env)][Tokens.SPORTX],
    );
  });

  it("should get metadata", async () => {
    const metadata = await sportX.getMetadata();
    expect(metadata.executorAddress).to.exist;
  });

  it("should lookup markets", async () => {
    const activeMarkets = await sportX.getActiveMarkets();
    const markets = await sportX.marketLookup([activeMarkets[0].marketHash]);
    expect(markets.length).equal(1);
  });

  it("should get leagues", async () => {
    const leagues = await sportX.getLeagues();
    expect(leagues.length).greaterThan(0);
  });

  it("should get sports", async () => {
    const sports = await sportX.getSports();
    expect(sports.length).greaterThan(0);
  });

  it("should get popular markets", async () => {
    await sportX.getPopularMarkets();
  });

  it("should get active leagues", async () => {
    await sportX.getActiveLeagues();
  });

  it("should get live scores", async () => {
    await sportX.getLiveScores(["L7187811"]);
  });

  it("should get active markets", async () => {
    const activeMarkets = await sportX.getActiveMarkets();
    expect(activeMarkets.length).greaterThan(0);
  });

  it("should get active markets with parameters", async () => {
    await sportX.getActiveMarkets(
      undefined,
      undefined,
      "1",
      undefined,
      "game-lines"
    );
  });

  it("should make a new orders", async () => {
    const newOrder: INewOrder = {
      marketHash: testMarketHash,
      totalBetSize: convertToTrueTokenAmount(
        50,
        TOKEN_ADDRESSES[getNetwork(env)][Tokens.SPORTX]
      ).toString(),
      percentageOdds: convertToAPIPercentageOdds(0.5).toString(),
      expiry: Math.floor((Date.now() + 3600 * 1000) / 1000),
      isMakerBettingOutcomeOne: true,
      baseToken: TOKEN_ADDRESSES[getNetwork(env)][Tokens.SPORTX],
    };
    const secondNewOrder: INewOrder = {
      marketHash: testMarketHash,
      totalBetSize: convertToTrueTokenAmount(
        50,
        TOKEN_ADDRESSES[getNetwork(env)][Tokens.SPORTX]
      ).toString(),
      percentageOdds: convertToAPIPercentageOdds(0.5).toString(),
      expiry: Math.floor((Date.now() + 3600 * 1000) / 1000),
      isMakerBettingOutcomeOne: true,
      baseToken: TOKEN_ADDRESSES[getNetwork(env)][Tokens.SPORTX],
    };
    const response = await sportX.newOrder([newOrder, secondNewOrder]);
    expect(response.status).to.equal("success");
  });

it("should cancel orders by event", async () => {
  const response = await sportX.cancelOrdersByEvent(testSportXeventId);
  expect(response.status).to.equal("success");
});

  it("should cancel all orders", async () => {
    const response = await sportX.cancelAllOrders();
    expect(response.status).to.equal("success");
  });

  it("should cancel an order", async () => {
    const newOrder: INewOrder = {
      marketHash: testMarketHash,
      totalBetSize: convertToTrueTokenAmount(
      400,
        TOKEN_ADDRESSES[getNetwork(env)][Tokens.SPORTX]
      ).toString(),
      percentageOdds: convertToAPIPercentageOdds(0.5).toString(),
      expiry: Math.floor((Date.now() + 3600 * 1000) / 1000),
      isMakerBettingOutcomeOne: true,
      baseToken: TOKEN_ADDRESSES[getNetwork(env)][Tokens.SPORTX],
    };
    const {
      data: { orders },
    } = await sportX.newOrder([newOrder]);
    const response = await sportX.cancelOrder(orders);
    expect(response.status).to.equal("success");
  });

  it("should convert from protocol percentage odds", () => {
    const odds = "88985727650227679586";
    const convertedOdds = convertFromAPIPercentageOdds(odds);
    expect(convertedOdds).to.equal(0.8898572765022768);
  });

  it("should get active orders for an address", async () => {
    const orders = await sportX.getOrders([testMarketHash]);
    const maker = orders[0].maker;
    const activeOrders = await sportX.getOrders(undefined, maker);
    expect(Object.keys(activeOrders).length).greaterThan(0);
  });

  it("should get active orders for a market", async () => {
    const orders = await sportX.getOrders([testMarketHash]);
    expect(orders.length).greaterThan(0);
  });

  it("should get pending bets", async () => {
    const payload: IPendingBetsRequest = {
      bettor: wallet.address,
    };
    const result = await sportX.getPendingOrFailedBets(payload);
  });

  it("should get trades", async () => {
    const response = await sportX.getTrades({});
    expect(response.trades.length).greaterThan(0);
  });

  it("should fill an order", async () => {
    const orders = await sportX.getOrders(
      [testMarketHash],
      undefined,
      TOKEN_ADDRESSES[getNetwork(env)][Tokens.SPORTX]
    );
    const oneSidedOrders = orders.filter(
      (order) => order.isMakerBettingOutcomeOne
    );
    const fill = await sportX.fillOrders(
      oneSidedOrders,
      oneSidedOrders.map((o) =>
        convertToTrueTokenAmount(
          30,
          TOKEN_ADDRESSES[getNetwork(env)][Tokens.SPORTX]
        )
      )
    );
    expect(fill.status).to.equal("success");
  });
});
