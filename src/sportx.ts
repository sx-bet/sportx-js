import * as ably from "ably";
import fetch from "cross-fetch";
import debug from "debug";
import ethSigUtil from "eth-sig-util";
import { Contract, providers, Signer, Wallet } from "ethers";
import { JsonRpcProvider, Web3Provider } from "ethers/providers";
import {
  BigNumber,
  bigNumberify,
  isHexString,
  randomBytes
} from "ethers/utils";
import { EventEmitter } from "events";
import queryString from "query-string";
import { isArray, isBoolean } from "util";
import daiArtifact from "./artifacts/DAI.json";
import {
  EIP712_FILL_HASHER_ADDRESSES,
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
import {
  ICancelDetails,
  IFillDetails,
  IFillDetailsMetadata,
  IPermit
} from "./types/internal";
import {
  IDetailedRelayerMakerOrder,
  IGetTradesRequest,
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
  getCancelOrderEIP712Payload,
  getDaiPermitEIP712Payload,
  getFillOrderEIP712Payload,
  getOrderHash,
  getOrderSignature
} from "./utils/signing";
import {
  isAddress,
  isPositiveBigNumber,
  validateIFillDetailsMetadata,
  validateIGetTradesRequest,
  validateINewOrderSchema,
  validateISignedRelayerMakerOrder
} from "./utils/validation";

export interface ISportX extends EventEmitter {
  init(): Promise<void>;
  getMetadata(): Promise<IMetadata>;
  getLeagues(): Promise<ILeague[]>;
  getSports(): Promise<ISport[]>;
  getActiveMarkets(): Promise<IMarket[]>;
  newOrder(order: INewOrder): Promise<IRelayerResponse>;
  cancelOrder(
    orderHashes: string[],
    message?: string
  ): Promise<IRelayerResponse>;
  getRecentPendingBets(
    address: string,
    baseToken: string
  ): Promise<IPendingBet[]>;
  getOrders(
    marketHashes?: string[],
    maker?: string,
    baseToken?: string
  ): Promise<IDetailedRelayerMakerOrder[]>;
  fillOrders(
    orders: IRelayerMakerOrder[],
    takerAmounts: string[],
    fillDetailsMetadata?: IFillDetailsMetadata,
    affiliateAddress?: string,
    approvalTx?: string
  ): Promise<IRelayerResponse>;
  suggestOrders(
    marketHash: string,
    betSize: string,
    takerDirectionOutcomeOne: boolean,
    taker: string,
    baseToken: string
  ): Promise<IRelayerResponse>;
  getTrades(tradeRequest: IGetTradesRequest): Promise<ITrade[]>;
  approveSportXContractsDai(): Promise<IRelayerResponse>;
  getRealtimeConnection(): ably.Types.RealtimePromise;
}

class SportX extends EventEmitter implements ISportX {
  private signingWallet: Signer;
  private relayerUrl: string;
  private provider: JsonRpcProvider;
  private initialized: boolean = false;
  private debug = debug("sportx-js");
  private metadata!: IMetadata;
  private ably!: ably.Types.RealtimePromise;
  private environment: Environments;
  private privateKey!: string;
  private chainId!: number;
  private daiWrapper: Contract;

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
    this.daiWrapper = new Contract(
      TOKEN_ADDRESSES[Tokens.DAI][this.environment],
      daiArtifact.abi,
      this.provider
    );
  }
  public getRealtimeConnection(): ably.Types.RealtimePromise {
    return this.ably;
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
    const network = await this.provider.getNetwork();
    this.chainId = network.chainId;
    this.initialized = true;
    this.debug("Initialized");
  }

  public async getMetadata(): Promise<IMetadata> {
    this.debug("getMetadata");
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.METADATA}`
    );
    const result = await this.tryParseResponse(
      response,
      "Can't fetch metadata"
    );
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
    const result = await this.tryParseResponse(response, "Can't fetch leagues");
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
    const result = await this.tryParseResponse(response, "Can't fetch sports");
    const { data } = result;
    return data as ISport[];
  }

  public async getActiveMarkets(): Promise<IMarket[]> {
    this.debug("getActiveMarkets");
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.ACTIVE_MARKETS}`
    );
    const result = await this.tryParseResponse(
      response,
      "Can't fetch active markets"
    );
    this.debug("Relayer response");
    this.debug(result);
    const {
      data: { markets }
    } = result;
    return markets as IMarket[];
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
      executor: this.metadata.executorAddress,
      baseToken: order.baseToken,
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
    const result = await this.tryParseResponse(
      response,
      "Can't submit new order"
    );
    this.debug("Relayer response");
    this.debug(result);
    return result as IRelayerResponse;
  }

  public async suggestOrders(
    marketHash: string,
    betSize: string,
    takerDirectionOutcomeOne: boolean,
    taker: string,
    baseToken: string
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
    if (!isAddress(baseToken)) {
      throw new APISchemaError("baseToken is not a valid address");
    }
    const payload: IRelayerMarketOrderRequest = {
      marketHash,
      takerPayAmount: betSize,
      takerDirection: takerDirectionOutcomeOne ? "outcomeOne" : "outcomeTwo",
      taker,
      baseToken
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
    const result = await this.tryParseResponse(
      response,
      "Can't get suggested orders"
    );
    this.debug("Relayer response");
    this.debug(result);
    return result as IRelayerResponse;
  }

  public async fillOrders(
    orders: ISignedRelayerMakerOrder[],
    takerAmounts: string[],
    fillDetailsMetadata?: IFillDetailsMetadata,
    affiliateAddress?: string,
    approvalTx?: string
  ): Promise<IRelayerResponse> {
    this.debug("fillOrders");
    orders.forEach(order => {
      const validation = validateISignedRelayerMakerOrder(order);
      if (validation !== "OK") {
        this.debug("One of the orders is malformed");
        throw new APISchemaError(validation);
      }
    });
    if (affiliateAddress && !isAddress(affiliateAddress)) {
      this.debug("Affiliate address is malformed");
      throw new APISchemaError("Affiliate address malformed.");
    }
    if (fillDetailsMetadata) {
      const validation = validateIFillDetailsMetadata(fillDetailsMetadata);
      if (validation !== "OK") {
        this.debug("Metadata malformed");
        throw new APISchemaError(validation);
      }
    }
    if (!isArray(takerAmounts)) {
      throw new APISchemaError("takerAmounts is not an array");
    }
    if (!takerAmounts.every(amount => isPositiveBigNumber(amount))) {
      throw new APISchemaError("takerAmounts has some invalid number strings");
    }
    const fillSalt = bigNumberify(randomBytes(32));
    const solidityOrders = orders.map(convertToContractOrder);
    const orderHashes = solidityOrders.map(getOrderHash);
    const finalFillDetailsMetadata: IFillDetailsMetadata = fillDetailsMetadata || {
      action: "N/A",
      market: "N/A",
      betting: "N/A",
      stake: "N/A",
      odds: "N/A",
      returning: "N/A"
    };
    const fillDetails: IFillDetails = {
      ...finalFillDetailsMetadata,
      fills: {
        orders: orders.map(convertToContractOrder),
        makerSigs: orders.map(order => order.signature),
        takerAmounts: takerAmounts.map(bigNumberify),
        fillSalt
      }
    };
    const fillOrderPayload = getFillOrderEIP712Payload(
      fillDetails,
      this.chainId,
      EIP712_FILL_HASHER_ADDRESSES[this.environment]
    );
    const takerSignature = await this.getEip712Signature(fillOrderPayload);
    const payload: IRelayerMetaFillOrderRequest = {
      orderHashes,
      takerAmounts,
      taker: await this.signingWallet.getAddress(),
      takerSig: takerSignature,
      fillSalt: fillSalt.toString(),
      ...finalFillDetailsMetadata,
      affiliateAddress,
      approvalTx
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
    const result = await this.tryParseResponse(response, "Can't fill orders.");
    this.debug("Relayer response");
    this.debug(result);
    return result as IRelayerResponse;
  }

  public async cancelOrder(orderHashes: string[], message?: string) {
    this.debug("cancelOrder");
    if (!isArray(orderHashes)) {
      throw new APISchemaError("orderHashes is not an array");
    }
    if (!orderHashes.every(hash => isHexString(hash))) {
      throw new APISchemaError("orderHashes has some invalid order hashes.");
    }
    if (message && typeof message !== "string") {
      throw new APISchemaError("message is not a string");
    }
    const finalMessage = message || "N/A";
    const cancelDetails: ICancelDetails = {
      orders: orderHashes,
      message: finalMessage
    };
    const cancelOrderPayload = getCancelOrderEIP712Payload(
      cancelDetails,
      this.chainId
    );
    const cancelSignature = await this.getEip712Signature(cancelOrderPayload);
    const payload: IRelayerCancelOrderRequest = {
      ...cancelDetails,
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
    const result = await this.tryParseResponse(
      response,
      "Can't cancel orders."
    );
    this.debug("Relayer response");
    this.debug(result);
    return result as IRelayerResponse;
  }

  public async getRecentPendingBets(
    address: string,
    baseToken: string
  ): Promise<IPendingBet[]> {
    this.debug("getRecentPendingBets");
    if (!isAddress(address)) {
      throw new APISchemaError(`Address ${address} is not a valid address`);
    }
    const payload = {
      address,
      baseToken
    };
    const qsPayload = queryString.stringify(payload);
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.PENDING_BETS}?${qsPayload}`
    );
    const result = await this.tryParseResponse(
      response,
      "Can't get recent pending bets"
    );
    this.debug("Relayer response");
    this.debug(result);
    const { data } = result;
    const pendingBets: IPendingBet[] = data;
    return pendingBets;
  }

  public async getTrades(tradeRequest: IGetTradesRequest): Promise<ITrade[]> {
    this.debug("getTrades");
    const validation = validateIGetTradesRequest(tradeRequest);
    if (validation !== "OK") {
      throw new APISchemaError(validation);
    }
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.TRADES}`,
      {
        method: "POST",
        body: JSON.stringify(tradeRequest),
        headers: { "Content-Type": "application/json" }
      }
    );
    const result = await this.tryParseResponse(response, "Can't get trades");
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
    maker?: string,
    baseToken?: string
  ): Promise<IDetailedRelayerMakerOrder[]> {
    this.debug("getOrders");
    if (marketHashes && !marketHashes.every(hash => isHexString(hash))) {
      throw new APISchemaError(
        `One of the supplied market hashes is not a valid hex string.`
      );
    }
    if (maker && !isAddress(maker)) {
      throw new APISchemaError(`maker is not a valid address`);
    }
    if (baseToken && !isAddress(baseToken)) {
      throw new APISchemaError(`baseToken is not a valid address`);
    }
    const payload = {
      ...(marketHashes && { marketHashes }),
      ...(maker && { maker }),
      ...(baseToken && { baseToken })
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
    const result = await this.tryParseResponse(response, "Can't get orders");
    this.debug("Relayer response");
    this.debug(result);
    const { data } = result;
    const orders: IDetailedRelayerMakerOrder[] = data;
    return orders;
  }

  public async approveSportXContractsDai() {
    const walletAddress = await this.signingWallet.getAddress();
    const nonce: BigNumber = await this.daiWrapper.nonces(walletAddress);
    const details: IPermit = {
      holder: walletAddress,
      spender: TOKEN_TRANSFER_PROXY_ADDRESS[this.environment],
      nonce: nonce.toNumber(),
      expiry: 0,
      allowed: true
    };
    const signPayload = getDaiPermitEIP712Payload(
      details,
      this.chainId,
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
    const result = await this.tryParseResponse(
      response,
      "Can't approx SportX contracts"
    );

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
    } else if (
      (this.provider as Web3Provider)._web3Provider.isMetaMask === true
    ) {
      const walletAddress = await this.signingWallet.getAddress();
      const signature: string = await this.provider.send(
        "eth_signTypedData_v4",
        [walletAddress, JSON.stringify(payload)]
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

  private async tryParseResponse(response: Response, errorMessage: string) {
    const textResponse = await response.text();
    const { result, valid } = tryParseJson(textResponse);
    if (valid && response.status !== 200) {
      this.debug(response.status);
      this.debug(response.statusText);
      throw new APIError(
        result,
        `${errorMessage}. Response code: ${response.status}`
      );
    } else if (!valid) {
      throw new APIError(undefined, `Can't parse JSON ${textResponse}`);
    } else {
      return result;
    }
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
