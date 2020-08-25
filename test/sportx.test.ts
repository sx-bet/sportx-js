import { expect } from "chai";
import { Contract, Wallet } from "ethers";
import { Zero } from "ethers/constants";
import { JsonRpcProvider } from "ethers/providers";
import { BigNumber, Interface, parseUnits } from "ethers/utils";
import "mocha";
import moment from "moment";
import {
  getDaiPermitEIP712Payload,
  INewOrder,
  IPendingBetsRequest,
  IPermit
} from "../src";
import {
  Environments,
  TOKEN_ADDRESSES,
  TOKEN_TRANSFER_PROXY_ADDRESS,
  Tokens
} from "../src/constants";
import { ISportX, newSportX } from "../src/sportx";
import {
  convertFromAPIPercentageOdds,
  convertToAPIPercentageOdds,
  convertToTrueTokenAmount
} from "../src/utils/convert";
import { getSidechainNetwork } from "../src/utils/networks";
import daiArtifact from "./DAI.json";

// tslint:disable no-string-literal

const TEST_MNEMONIC =
  "elegant execute say gain evil afford puppy upon amateur planet lunar pen";

describe("sportx", () => {
  let sportX: ISportX;
  const env: Environments = parseInt(process.env.ENVIRONMENT!, 10);
  const provider = new JsonRpcProvider(process.env.MAINCHAIN_PROVIDER_URL);
  const wallet = Wallet.fromMnemonic(TEST_MNEMONIC).connect(provider);

  before("should initialize", async () => {
    sportX = await newSportX(
      env,
      process.env.SIDECHAIN_PROVIDER_URL!,
      wallet.privateKey,
      process.env.MAINCHAIN_PROVIDER_URL
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
      baseToken: TOKEN_ADDRESSES[getSidechainNetwork(env)][Tokens.DAI]
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
      baseToken: TOKEN_ADDRESSES[getSidechainNetwork(env)][Tokens.DAI]
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
      TOKEN_ADDRESSES[getSidechainNetwork(env)][Tokens.DAI]
    );
    expect(suggestions.status).to.equal("success");
  });

  it("should get pending bets", async () => {
    const payload: IPendingBetsRequest = {
      bettor: wallet.address
    };
    const result = await sportX.getPendingOrFailedBets(payload);
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
      TOKEN_ADDRESSES[getSidechainNetwork(env)][Tokens.DAI]
    );
    const ordersToFill = orders.filter(order =>
      suggestions.data.orderHashes.includes(order.orderHash)
    );
    const fill = await sportX.fillOrders(ordersToFill, [
      convertToTrueTokenAmount(10)
    ]);
    expect(fill.status).to.equal("success");
  });

  it("should fill an order with approval tx", async () => {
    // const daiContract = new Contract(daiAddress, daiArtifact.abi, wallet)
    // await daiContract.approve(TOKEN_TRANSFER_PROXY_ADDRESS[Environments.RINKEBY], parseUnits("10000", 18))
    const activeMarkets = await sportX.getActiveMarkets();
    const market = activeMarkets[7].marketHash;
    const orders = await sportX.getOrders([market]);
    const suggestions = await sportX.suggestOrders(
      market,
      convertToTrueTokenAmount(10),
      true,
      wallet.address,
      TOKEN_ADDRESSES[getSidechainNetwork(env)][Tokens.DAI]
    );
    const ordersToFill = orders.filter(order =>
      suggestions.data.orderHashes.includes(order.orderHash)
    );

    const daiInterface = new Interface(daiArtifact.abi);
    const data = daiInterface.functions.approve.encode([
      TOKEN_TRANSFER_PROXY_ADDRESS[env],
      parseUnits("10", 18)
    ]);
    const nonce = await provider.getTransactionCount(wallet.address);
    const tx = {
      gasPrice: 2000000000,
      gasLimit: 100000,
      data,
      to: TOKEN_ADDRESSES[getSidechainNetwork(env)][Tokens.DAI],
      nonce,
      chainId: (await provider.getNetwork()).chainId
    };
    const signedTransaction = await wallet.sign(tx);
    const fill = await sportX.fillOrders(
      ordersToFill,
      [convertToTrueTokenAmount(5)],
      undefined,
      undefined
    );
  });

  // it.only("should allow bets quickly after approval", async () => {
  //   console.log(wallet.address)
  //   const marketHash = "0x4360ce5e4304f34bd6b6f08603761abd8ce26ceba709611d533f97232ddb6f02";
  //   const chainId = (await provider.getNetwork()).chainId
  //   const daiContract = new Contract(daiAddress, daiArtifact.abi, wallet)
  //   const tx = await daiContract.approve(TOKEN_TRANSFER_PROXY_ADDRESS[env], Zero)
  //   console.log("Tx hash for approval")
  //   console.log(tx.hash)
  //   const orders = (await sportX.getOrders([marketHash])).filter(order => order.baseToken === TOKEN_ADDRESSES[Tokens.DAI][env])
  //   await provider.waitForTransaction(tx.hash)
  //   console.log("Approval set to zero")
  //   const nonce: BigNumber = await daiContract.nonces(wallet.address);
  //   const details: IPermit = {
  //     holder: wallet.address,
  //     spender: TOKEN_TRANSFER_PROXY_ADDRESS[env],
  //     nonce: nonce.toNumber(),
  //     expiry: 0,
  //     allowed: true,
  //   };
  //   const signPayload = getDaiPermitEIP712Payload(
  //     details,
  //     chainId,
  //     TOKEN_ADDRESSES[Tokens.DAI][env]
  //   );
  //   const signature = await sportX.getEip712Signature(signPayload);
  //   const payload = {
  //     ...details,
  //     signature,
  //   };
  //   try {

  //     const fillWithApproval = await sportX.fillOrders([orders[0]], [convertToTrueTokenAmount(5)], undefined, undefined, payload)
  //     console.log("Fill with approval")
  //     console.log(fillWithApproval)
  //     const fillWithoutApproval = await sportX.fillOrders([orders[0]], [convertToTrueTokenAmount(5)], undefined, undefined)
  //     console.log("Fill without approval")
  //     console.log(fillWithoutApproval)
  //   } catch (e) {
  //     console.error(e)
  //   }
  //   // Fill with meta approval

  // })

  it("should get connected realtime connection", async () => {
    const connection = sportX.getRealtimeConnection();
    const channel = connection.channels.get("live_scores");
    expect(channel).not.undefined;
  });

  it("should meta approve DAI", async () => {
    await sportX.approveSportXContractsDai();
  });
});
