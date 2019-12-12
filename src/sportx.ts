import * as ably from "ably";
import fetch from "cross-fetch";
import debug from "debug";
import ethSigUtil from "eth-sig-util";
import { providers, Signer, utils, Wallet } from "ethers";
import { Zero } from "ethers/constants";
import { JsonRpcProvider } from "ethers/providers";
import { bigNumberify, isHexString, randomBytes } from "ethers/utils";
import { EventEmitter } from "events";
import queryString from "query-string";
import { isArray, isBoolean, isNumber, isUndefined } from "util";
import {
  CHANNEL_BASE_KEYS,
  Environments,
  PRODUCTION_RELAYER_URL,
  RELAYER_HTTP_ENDPOINTS,
  RELAYER_TIMEOUT,
  RINKEBY_RELAYER_URL,
  Tokens,
  TOKEN_ADDRESSES,
  TOKEN_TRANSFER_PROXY_ADDRESS
} from "./constants";
import { APIError } from "./errors/api_error";
import { APISchemaError } from "./errors/schema_error";
import { IPermit } from "./types/internal";
import {
  IDetailedRelayerMakerOrder,
  ILeague,
  IMarket,
  IMetadata,
  INewOrder,
  IPendingBet,
  IRelayerCancelOrderRequest,
  IRelayerMakerOrder,
  IRelayerMarketOrderRequest,
  IRelayerMetaFillOrderRequest,
  IRelayerResponse,
  ISignedRelayerMakerOrder,
  ISport,
  ITrade
} from "./types/relayer";
import { convertToContractOrder } from "./utils/convert";
import { tryParseJson } from "./utils/misc";
import {
  getDaiPermitEIP712Payload,
  getMultiFillHash,
  getOrderHash,
  getOrderSignature
} from "./utils/signing";
import {
  isAddress,
  isPositiveBigNumber,
  validateINewOrderSchema,
  validateIRelayerMakerOrder
} from "./utils/validation";

export interface ISportX extends EventEmitter {
  init(): Promise<void>;
  getMetadata(): Promise<IMetadata>;
  getLeagues(): Promise<ILeague[]>;
  getSports(): Promise<ISport[]>;
  getActiveMarkets(token: Tokens): Promise<IMarket[]>;
  newOrder(order: INewOrder): Promise<IRelayerResponse>;
  cancelOrder(orderHashes: string[]): Promise<IRelayerResponse>;
  getRecentPendingBets(address: string, token: Tokens): Promise<IPendingBet[]>;
  getOrders(
    marketHashes?: string[],
    maker?: string
  ): Promise<IDetailedRelayerMakerOrder[]>;
  fillOrders(
    orders: IRelayerMakerOrder[],
    takerAmounts: string[]
  ): Promise<IRelayerResponse>;
  suggestOrders(
    marketHash: string,
    betSize: string,
    takerDirectionOutcomeOne: boolean,
    taker: string
  ): Promise<IRelayerResponse>;
  getTrades(
    startDate?: number,
    endDate?: number,
    settled?: boolean
  ): Promise<ITrade[]>;
  approveSportXContractsDai(): Promise<IRelayerResponse>;
  subscribeGameOrderBook(compactGameId: string): Promise<void>;
  unsubscribeGameOrderBook(compactGameId: string): Promise<void>;
  subscribeActiveOrders(maker: string): Promise<void>;
  unsubscribeActiveOrders(maker: string): Promise<void>;
}

interface IChannels {
  [channelName: string]: ably.Types.RealtimeChannelPromise;
}

class SportX extends EventEmitter implements ISportX {
  private signingWallet: Signer;
  private relayerUrl: string;
  private provider: JsonRpcProvider;
  private initialized: boolean = false;
  private debug = debug("sportx-js");
  private metadata!: IMetadata;
  private ably!: ably.Types.RealtimePromise;
  private ablyChannels!: IChannels;
  private environment: Environments;
  private privateKey!: string;

  constructor(
    env: Environments,
    privateKey?: string,
    providerUrl?: string,
    provider?: providers.Web3Provider
  ) {
    super();
    if (privateKey && !isHexString(privateKey)) {
      throw new Error(`${privateKey} is not a valid private key.`);
    } else if (privateKey) {
      if (!providerUrl) {
        throw new Error(
          `Provider URL must be provided if initializing via private key`
        );
      }
      this.provider = new JsonRpcProvider(providerUrl);
      this.signingWallet = new Wallet(privateKey);
      this.privateKey = privateKey;
    } else if (provider) {
      this.signingWallet = provider.getSigner(0);
      this.provider = provider;
    } else {
      throw new Error(`Neither privateKey nor provider provided.`);
    }
    if (env === Environments.PRODUCTION) {
      this.relayerUrl = PRODUCTION_RELAYER_URL;
    } else if (env === Environments.RINKEBY) {
      this.relayerUrl = RINKEBY_RELAYER_URL;
    } else {
      throw new Error(`Invalid environment: ${env}`);
    }
    this.environment = env;
  }

  public async init() {
    if (this.initialized) {
      throw new Error("Already initialized");
    }
    this.ably = new ably.Realtime.Promise({
      authUrl: `${this.relayerUrl}/user/token`
    });
    await new Promise((resolve, reject) => {
      this.ably.connection.on("connected", () => {
        resolve();
      });
      setTimeout(() => reject(), RELAYER_TIMEOUT);
    });
    this.metadata = await this.getMetadata();
    this.initialized = true;
    this.ablyChannels = {};
    this.debug("Initialized");
  }

  public async getMetadata(): Promise<IMetadata> {
    this.debug("getMetadata");
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.METADATA}`
    );
    const textResponse = await response.text();
    if (response.status !== 200) {
      this.debug(response.status);
      this.debug(response.statusText);
      throw new APIError(
        `Can't fetch metadata. Response code: ${
          response.status
        }. Result: ${textResponse}`
      );
    }
    const { result, valid } = tryParseJson(textResponse);
    if (!valid) {
      throw new APIError(`Can't parse JSON ${textResponse}`);
    }
    this.debug("Relayer response");
    this.debug(result);
    const { data } = result;
    return data as IMetadata;
  }

  public async getLeagues(): Promise<ILeague[]> {
    this.debug("getLeagues");
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.LEAGUES}`
    );
    const textResponse = await response.text();
    if (response.status !== 200) {
      this.debug(response.status);
      this.debug(response.statusText);
      throw new APIError(
        `Can't fetch leagues. Response code: ${
          response.status
        }. Result: ${textResponse}`
      );
    }
    const { result, valid } = tryParseJson(textResponse);
    if (!valid) {
      throw new APIError(`Can't parse JSON ${textResponse}`);
    }
    this.debug("Relayer response");
    this.debug(result);
    const { data } = result;
    return data as ILeague[];
  }

  public async getSports(): Promise<ISport[]> {
    this.debug("getSports");
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.SPORTS}`
    );
    const textResponse = await response.text();
    if (response.status !== 200) {
      this.debug(response.status);
      this.debug(response.statusText);
      throw new APIError(
        `Can't fetch sports. Response code: ${
          response.status
        }. Result: ${textResponse}`
      );
    }
    const { result, valid } = tryParseJson(textResponse);
    if (!valid) {
      throw new APIError(`Can't parse JSON ${textResponse}`);
    }
    this.debug("Relayer response");
    this.debug(result);
    const { data } = result;
    return data as ISport[];
  }

  public async getActiveMarkets(token: Tokens): Promise<IMarket[]> {
    this.debug("getActiveMarkets");
    const payload = {
      baseToken: token
    };
    const qsPayload = queryString.stringify(payload);
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.ACTIVE_MARKETS}?${qsPayload}`
    );
    const textResponse = await response.text();
    if (response.status !== 200) {
      this.debug(response.status);
      this.debug(response.statusText);
      throw new APIError(
        `Can't fetch active markets. Response code: ${
          response.status
        }. Result: ${textResponse}`
      );
    }
    const { result, valid } = tryParseJson(textResponse);
    if (!valid) {
      throw new APIError(`Can't parse JSON ${textResponse}`);
    }
    this.debug("Relayer response");
    this.debug(result);
    const { data } = result;
    return data as IMarket[];
  }

  public async newOrder(order: INewOrder) {
    this.debug("newOrder");
    const schemaValidation = validateINewOrderSchema(order);
    if (schemaValidation !== "OK") {
      throw new APISchemaError(schemaValidation);
    }
    const bigNumBetSize = bigNumberify(order.totalBetSize);
    const salt = bigNumberify(randomBytes(32)).toString();
    const apiMakerOrder: IRelayerMakerOrder = {
      marketHash: order.marketHash,
      maker: await this.signingWallet.getAddress(),
      totalBetSize: bigNumBetSize.toString(),
      percentageOdds: order.percentageOdds,
      expiry: order.expiry.toString(),
      relayerTakerFee: this.metadata.fees.relayerTakerFee,
      relayerMakerFee: this.metadata.fees.relayerMakerFee,
      executor: this.metadata.executorAddress,
      relayer: this.metadata.relayerAddress,
      salt,
      isMakerBettingOutcomeOne: order.isMakerBettingOutcomeOne
    };
    this.debug(`New order`);
    this.debug(apiMakerOrder);
    const signature = await getOrderSignature(
      apiMakerOrder,
      this.signingWallet
    );
    this.debug(`New order signature: ${signature}`);
    const signedApiMakerOrder: ISignedRelayerMakerOrder = {
      ...apiMakerOrder,
      signature
    };
    this.debug(`New signed order`);
    this.debug(signedApiMakerOrder);
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.NEW_ORDER}`,
      {
        method: "POST",
        body: JSON.stringify([signedApiMakerOrder]),
        headers: { "Content-Type": "application/json" }
      }
    );
    const textResponse = await response.text();
    if (response.status !== 200) {
      this.debug(response.status);
      this.debug(response.statusText);
      throw new APIError(
        `Can't fetch metadata. Response code: ${
          response.status
        }. Result: ${textResponse}`
      );
    }
    const { result, valid } = tryParseJson(textResponse);
    if (!valid) {
      throw new APIError(`Can't parse JSON ${textResponse}`);
    }
    this.debug("Relayer response");
    this.debug(result);
    return result as IRelayerResponse;
  }

  public async suggestOrders(
    marketHash: string,
    betSize: string,
    takerDirectionOutcomeOne: boolean,
    taker: string
  ) {
    this.debug("suggestOrders");
    if (!isHexString(marketHash)) {
      throw new APISchemaError("marketHash is not a hex string ");
    }
    if (!isPositiveBigNumber(betSize)) {
      throw new APISchemaError("betSize as a number is not positive");
    }
    if (!isBoolean(takerDirectionOutcomeOne)) {
      throw new APISchemaError("takerDirectionOutcomeOne is not a boolean");
    }
    if (!isAddress(taker)) {
      throw new APISchemaError("taker is not a valid address");
    }
    const payload: IRelayerMarketOrderRequest = {
      marketHash,
      takerPayAmount: betSize,
      takerDirection: takerDirectionOutcomeOne ? "outcomeOne" : "outcomeTwo",
      taker
    };
    this.debug("Suggest orders payload:");
    this.debug(payload);
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.SUGGEST_ORDERS}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      }
    );
    const textResponse = await response.text();
    if (response.status !== 200) {
      this.debug(response.status);
      this.debug(response.statusText);
      throw new APIError(
        `Can't get suggested orders. Response code: ${
          response.status
        }. Result: ${textResponse}`
      );
    }
    const { result, valid } = tryParseJson(textResponse);
    if (!valid) {
      throw new APIError(`Can't parse JSON ${textResponse}`);
    }
    this.debug("Relayer response");
    this.debug(result);
    return result as IRelayerResponse;
  }

  public async fillOrders(
    orders: IRelayerMakerOrder[],
    takerAmounts: string[]
  ): Promise<IRelayerResponse> {
    this.debug("fillOrders");
    orders.forEach(order => {
      const validation = validateIRelayerMakerOrder(order);
      if (validation !== "OK") {
        this.debug("One of the orders is malformed");
        throw new APISchemaError(validation);
      }
    });
    if (!isArray(takerAmounts)) {
      throw new APISchemaError("takerAmounts is not an array");
    }
    if (!takerAmounts.every(amount => isPositiveBigNumber(amount))) {
      throw new APISchemaError("takerAmounts has some invalid number strings");
    }
    const fillSalt = bigNumberify(randomBytes(32));
    const submitterFee = Zero;
    const solidityOrders = orders.map(convertToContractOrder);
    const orderHashes = solidityOrders.map(getOrderHash);
    const bigNumTakerAmounts = takerAmounts.map(bigNumberify);
    const fillHash = getMultiFillHash(
      solidityOrders,
      bigNumTakerAmounts,
      fillSalt,
      submitterFee
    );
    const takerSignature = await this.signingWallet.signMessage(
      utils.arrayify(fillHash)
    );
    const payload: IRelayerMetaFillOrderRequest = {
      orderHashes,
      takerAmounts,
      taker: await this.signingWallet.getAddress(),
      takerSig: takerSignature,
      fillSalt: fillSalt.toString(),
      submitterFee: submitterFee.toString()
    };
    this.debug("Meta fill payload");
    this.debug(payload);
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.FILL_ORDERS}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      }
    );
    const textResponse = await response.text();
    if (response.status !== 200) {
      this.debug(response.status);
      this.debug(response.statusText);
      throw new APIError(
        `Can't fill orders. Response code: ${
          response.status
        }. Result: ${textResponse}`
      );
    }
    const { result, valid } = tryParseJson(textResponse);
    if (!valid) {
      throw new APIError(`Can't parse JSON ${textResponse}`);
    }
    this.debug("Relayer response");
    this.debug(result);
    return result as IRelayerResponse;
  }

  public async cancelOrder(orderHashes: string[]) {
    this.debug("cancelOrder");
    if (!isArray(orderHashes)) {
      throw new APISchemaError("orderHashes is not an array");
    }
    if (!orderHashes.every(hash => isHexString(hash))) {
      throw new APISchemaError("orderHashes has some invalid order hashes.");
    }
    const signingPayload = utils.solidityKeccak256(
      [...orderHashes.map(() => "bytes32"), "bool"],
      [...orderHashes, true]
    );
    const cancelSignature = await this.signingWallet.signMessage(
      utils.arrayify(signingPayload)
    );
    const payload: IRelayerCancelOrderRequest = {
      orderHashes,
      cancelSignature
    };
    this.debug("Cancel order payload");
    this.debug(payload);
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.CANCEL_ORDERS}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      }
    );
    const textResponse = await response.text();
    if (response.status !== 200) {
      this.debug(response.status);
      this.debug(response.statusText);
      throw new APIError(
        `Can't cancel orders. Response code: ${
          response.status
        }. Result: ${textResponse}`
      );
    }
    const { result, valid } = tryParseJson(textResponse);
    if (!valid) {
      throw new APIError(`Can't parse JSON ${textResponse}`);
    }
    this.debug("Relayer response");
    this.debug(result);
    return result as IRelayerResponse;
  }

  public async getRecentPendingBets(
    address: string,
    token: Tokens
  ): Promise<IPendingBet[]> {
    this.debug("getRecentPendingBets");
    if (!isAddress(address)) {
      throw new APISchemaError(`Address ${address} is not a valid address`);
    }
    const payload = {
      address,
      baseToken: token
    };
    const qsPayload = queryString.stringify(payload);
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.PENDING_BETS}?${qsPayload}`
    );
    const textResponse = await response.text();
    if (response.status !== 200) {
      this.debug(response.status);
      this.debug(response.statusText);
      throw new APIError(
        `Can't fetch metadata. Response code: ${
          response.status
        }. Result: ${textResponse}`
      );
    }
    const { result, valid } = tryParseJson(textResponse);
    if (!valid) {
      throw new APIError(`Can't parse JSON ${textResponse}`);
    }
    this.debug("Relayer response");
    this.debug(result);
    const { data } = result;
    const pendingBets: IPendingBet[] = data;
    return pendingBets;
  }

  public async getTrades(
    startDate?: number,
    endDate?: number,
    settled?: boolean
  ): Promise<ITrade[]> {
    this.debug("getTrades");
    if (!isUndefined(startDate) && !isNumber(startDate)) {
      throw new APISchemaError(`startDate is not a valid unix date.`);
    }
    if (!isUndefined(endDate) && !isNumber(endDate)) {
      throw new APISchemaError(`endDate is not a valid unix date.`);
    }
    if (!isUndefined(settled) && !isBoolean(settled)) {
      throw new APISchemaError(`settled is not a valid boolean value.`);
    }
    const payload = {
      ...(!isUndefined(startDate) && { startDate }),
      ...(!isUndefined(endDate) && { endDate }),
      ...(!isUndefined(settled) && { settled })
    };
    const qsPayload = queryString.stringify(payload);
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.TRADES}?${qsPayload}`
    );
    const textResponse = await response.text();
    if (response.status !== 200) {
      this.debug(response.status);
      this.debug(response.statusText);
      throw new APIError(
        `Can't get orders. Response code: ${
          response.status
        }. Result: ${textResponse}`
      );
    }
    const { result, valid } = tryParseJson(textResponse);
    if (!valid) {
      throw new APIError(`Can't parse JSON ${textResponse}`);
    }
    this.debug("Relayer response");
    this.debug(result);
    const {
      data: { trades }
    } = result;
    const ownerTrades: ITrade[] = trades;
    return ownerTrades;
  }

  public async getOrders(
    marketHashes?: string[],
    maker?: string
  ): Promise<IDetailedRelayerMakerOrder[]> {
    this.debug("getOrders");
    if (marketHashes && !marketHashes.every(hash => isHexString(hash))) {
      throw new APISchemaError(
        `One of the supplied market hashes is not a valid hex string.`
      );
    }
    if (maker && !isAddress(maker)) {
      throw new APISchemaError(
        `One of the supplied maker addresses is not a valid address.`
      );
    }
    const payload = {
      ...(marketHashes && { marketHashes }),
      ...(maker && { maker })
    };
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.ORDERS}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    const textResponse = await response.text();
    if (response.status !== 200) {
      this.debug(response.status);
      this.debug(response.statusText);
      throw new APIError(
        `Can't get orders. Response code: ${
          response.status
        }. Result: ${textResponse}`
      );
    }
    const { result, valid } = tryParseJson(textResponse);
    if (!valid) {
      throw new APIError(`Can't parse JSON ${textResponse}`);
    }
    this.debug("Relayer response");
    this.debug(result);
    const { data } = result;
    const orders: IDetailedRelayerMakerOrder[] = data;
    return orders;
  }

  public async subscribeGameOrderBook(compactGameId: string) {
    if (typeof compactGameId !== "string") {
      throw new APISchemaError(`${compactGameId} is not a valid game ID`);
    }
    await this.subscribeAblyChannel(
      CHANNEL_BASE_KEYS.GAME_ORDER_BOOK,
      compactGameId
    );
  }

  public async unsubscribeGameOrderBook(compactGameId: string) {
    if (typeof compactGameId !== "string") {
      throw new APISchemaError(`${compactGameId} is not a valid game ID`);
    }
    await this.unsubscribeAblyChannel(
      CHANNEL_BASE_KEYS.GAME_ORDER_BOOK,
      compactGameId
    );
  }

  public async subscribeActiveOrders(maker: string) {
    if (!isAddress(maker)) {
      throw new APISchemaError(`${maker} is not a valid address`);
    }
    await this.subscribeAblyChannel(CHANNEL_BASE_KEYS.ACTIVE_ORDERS, maker);
  }

  public async unsubscribeActiveOrders(maker: string) {
    if (!isAddress(maker)) {
      throw new APISchemaError(`${maker} is not a valid address`);
    }
    await this.unsubscribeAblyChannel(CHANNEL_BASE_KEYS.ACTIVE_ORDERS, maker);
  }

  public async approveSportXContractsDai() {
    const { chainId } = await this.provider.getNetwork();
    const walletAddress = await this.signingWallet.getAddress();
    const details: IPermit = {
      holder: walletAddress,
      spender: TOKEN_TRANSFER_PROXY_ADDRESS[this.environment],
      nonce: 0,
      expiry: 0,
      allowed: true
    };
    const signPayload = getDaiPermitEIP712Payload(
      details,
      chainId,
      TOKEN_ADDRESSES[Tokens.DAI][this.environment]
    );
    const signature = await this.getEip712Signature(signPayload);
    const payload = {
      ...details,
      signature
    };
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.DAI_APPROVAL}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    const textResponse = await response.text();
    if (response.status !== 200) {
      this.debug(response.status);
      this.debug(response.statusText);
      throw new APIError(
        `Can't approve SportX contracts. Response code: ${
          response.status
        }. Result: ${textResponse}`
      );
    }
    const { result, valid } = tryParseJson(textResponse);
    if (!valid) {
      throw new APIError(`Can't parse JSON ${textResponse}`);
    }
    this.debug("Relayer response");
    this.debug(result);
    return result as IRelayerResponse;
  }

  private async getEip712Signature(payload: any) {
    if (this.privateKey) {
      const bufferPrivateKey = Buffer.from(this.privateKey.substring(2), "hex");
      const signature: string = (ethSigUtil as any).signTypedData_v4(
        bufferPrivateKey,
        { data: payload }
      );
      return signature;
    } else {
      const walletAddress = await this.signingWallet.getAddress();
      const signature: string = await this.provider.send("eth_signTypedData", [
        walletAddress,
        payload
      ]);
      return signature;
    }
  }

  private async subscribeAblyChannel(baseChannel: string, subChannel: string) {
    const channelName = `${baseChannel}:${subChannel}`;
    if (this.ablyChannels[channelName]) {
      throw new APIError(`Already subscribed to ${channelName}`);
    }
    const channel = this.ably.channels.get(channelName);
    await channel.subscribe(message => {
      this.emit(message.name, message.data);
    });
    this.ablyChannels[channelName] = channel;
  }

  private async unsubscribeAblyChannel(
    baseChannel: string,
    subChannel: string
  ) {
    const channelName = `${baseChannel}:${subChannel}`;
    const channel = this.ablyChannels[channelName];
    if (!channel) {
      throw new APIError(`Not subscribed to ${channelName}`);
    }
    await channel.detach();
    delete this.ablyChannels[channelName];
  }
}

export async function newSportX(
  env: Environments,
  privateKey?: string,
  providerUrl?: string,
  provider?: providers.Web3Provider
) {
  const sportX = new SportX(env, privateKey, providerUrl, provider);
  await sportX.init();
  return sportX;
}
