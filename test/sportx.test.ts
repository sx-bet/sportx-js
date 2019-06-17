import { expect } from "chai";
import { Wallet } from "ethers";
import { parseUnits } from "ethers/utils";
import "mocha";
import moment from "moment";
import { INewOrder } from "../src";
import { Environments } from "../src/constants";
import { ISportX, newSportX } from "../src/sportx";
import { convertToProtocolPercentageOdds } from "../src/utils/convert";

const TEST_MNEMONIC =
  "elegant execute say gain evil afford puppy upon amateur planet lunar pen";

describe("sportx", () => {
  let sportX: ISportX;
  const wallet = Wallet.fromMnemonic(TEST_MNEMONIC);

  before("should initialize", async () => {
    sportX = await newSportX(Environments.RINKEBY, wallet.privateKey);
  });

  it("should get metadata", async () => {
    const metadata = await sportX.getMetadata();
    expect(metadata.relayerAddress).to.exist;
  });

  it("should get leagues", async () => {
    const leagues = await sportX.getLeagues();
    console.log(leagues);
  });

  it("should get sports", async () => {
    const sports = await sportX.getSports();
    console.log(sports);
  });

  it("should get active markets", async () => {
    const activeMarkets = await sportX.getActiveMarkets();
    console.log(activeMarkets);
  });

  it("should make a new order", async () => {
    const activeMarkets = await sportX.getActiveMarkets();
    const firstMarketHash = activeMarkets[0].marketHash;
    const newOrder: INewOrder = {
      marketHash: firstMarketHash,
      totalBetSize: parseUnits("10", 18).toString(),
      percentageOdds: convertToProtocolPercentageOdds(0.5).toString(),
      expiry: moment()
        .add(1, "hour")
        .unix(),
      isMakerBettingOutcomeOne: true
    };
    const response = await sportX.newOrder(newOrder);
    console.log(response);
  });

  it("should cancel an order", async () => {
    const activeMarkets = await sportX.getActiveMarkets();
    const firstMarketHash = activeMarkets[0].marketHash;
    const newOrder: INewOrder = {
      marketHash: firstMarketHash,
      totalBetSize: parseUnits("10", 18).toString(),
      percentageOdds: convertToProtocolPercentageOdds(0.5).toString(),
      expiry: moment()
        .add(1, "hour")
        .unix(),
      isMakerBettingOutcomeOne: true
    };
    const {
      data: { orderHash }
    } = await sportX.newOrder(newOrder);
    const response = await sportX.cancelOrder([orderHash]);
    console.log(response);
  });

  it("should get active orders for an address", async () => {
    const activeMarkets = await sportX.getActiveMarkets();
    const orders = await sportX.getOrders(activeMarkets[0].marketHash);
    const maker = orders[0].maker;
    const activeOrders = await sportX.getActiveOrders(maker);
    console.log(activeOrders)
  })

  it("should get active orders for a market", async () => {
    const activeMarkets = await sportX.getActiveMarkets();
    const orders = await sportX.getOrders(activeMarkets[0].marketHash);
    console.log(orders)
  })
});
