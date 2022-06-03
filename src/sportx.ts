import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber } from "@ethersproject/bignumber";
import { isHexString } from "@ethersproject/bytes";
import { AddressZero, MaxUint256 } from "@ethersproject/constants";
import { Contract } from "@ethersproject/contracts";
import { JsonRpcProvider, StaticJsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { randomBytes } from "@ethersproject/random";
import { Wallet } from "@ethersproject/wallet";
import * as ably from "ably";
import fetch from "cross-fetch";
import debug from "debug";
import ethSigUtil from "eth-sig-util";
import queryString from "query-string";
import ChildERC20 from "./artifacts/ChildERC20.json";
import ChildToken from "./artifacts/ChildToken.json";
import {
  CHAIN_IDS,
  DEFAULT_RPL_URLS,
  EIP712_FILL_HASHER_ADDRESSES,
  EIP712_VERSION,
  Environments,
  Networks,
  RELAYER_HTTP_ENDPOINTS,
  RELAYER_TIMEOUT,
  RELAYER_URLS,
  SidechainNetworks,
  Tokens,
  TOKEN_ADDRESSES,
  TOKEN_TRANSFER_PROXY_ADDRESS,
} from "./constants";
import { APIError } from "./errors/api_error";
import { APISchemaError } from "./errors/schema_error";
import {
  IApproveSpenderPayload,
  IBaseTokenWrappers,
  IFillDetails,
  IFillDetailsMetadata,
} from "./types/internal";
import {
  IActiveLeague,
  ICancelAllOrdersRequest,
  ICancelEventOrdersRequest,
  ICancelOrderRequest,
  IDetailedRelayerMakerOrder,
  IGetTradesRequest,
  ILeague,
  ILiveScore,
  IMarket,
  IMetadata,
  INewOrder,
  IPendingBet,
  IPendingBetsRequest,
  IRelayerHistoricalMarketRequest,
  IRelayerMakerOrder,
  IRelayerMetaFillOrderRequest,
  IRelayerResponse,
  ISignedRelayerMakerOrder,
  ISport,
  ITradesResponse,
} from "./types/relayer";
import { convertToContractOrder } from "./utils/convert";
import { tryParseJson } from "./utils/misc";
import { getNetwork } from "./utils/networks";
import {
  getCancelAllOrdersEIP712Payload,
  getCancelOrderEIP712Payload,
  getCancelOrderEventsEIP712Payload,
  getFillOrderEIP712Payload,
  getMaticEip712Payload,
  getOrderHash,
  getOrderSignature,
} from "./utils/signing";
import {
  isAddress,
  isPositiveBigNumber,
  validateIFillDetailsMetadata,
  validateIGetPendingBetsRequest,
  validateIGetTradesRequest,
  validateINewOrderSchema,
  validateISignedRelayerMakerOrder,
} from "./utils/validation";

export interface ISportX {
  init(): Promise<void>;
  getMetadata(): Promise<IMetadata>;
  getLeagues(): Promise<ILeague[]>;
  getSports(): Promise<ISport[]>;
  getActiveLeagues(): Promise<ILeague[]>;
  getActiveMarkets(
    mainLinesOnly?: boolean,
    eventId?: number,
    leagueId?: string,
    liveOnly?: boolean,
    betGroup?: string
  ): Promise<IMarket[]>;
  getPopularMarkets(): Promise<IMarket[]>;
  marketLookup(marketHashes: string[]): Promise<IMarket[]>;
  newOrder(orders: INewOrder[]): Promise<IRelayerResponse>;
  cancelOrder(orderHashes: string[]): Promise<IRelayerResponse>;
  cancelAllOrders(): Promise<IRelayerResponse>;
  cancelOrdersByEvent(sportXeventId: string): Promise<IRelayerResponse>;
  getPendingOrFailedBets(
    pendingBetsRequest: IPendingBetsRequest
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
    approveProxyPayload?: IApproveSpenderPayload
  ): Promise<IRelayerResponse>;
  getTrades(tradeRequest: IGetTradesRequest): Promise<ITradesResponse>;
  approveSportXContracts(token: string): Promise<any>;
  getRealtimeConnection(): ably.Types.RealtimePromise;
  getEip712Signature(payload: any): Promise<string>;
  getLiveScores(eventIds: string[]): Promise<ILiveScore[]>;
}

class SportX implements ISportX {
  private signingWallet: Signer;
  private relayerUrl: string;
  private provider: JsonRpcProvider;
  private initialized: boolean = false;
  private debug = debug("sportx-js");
  private metadata!: IMetadata;
  private ably!: ably.Types.RealtimePromise;
  private environment: Environments;
  private privateKey!: string;
  private sidechainChainId!: number;
  private network: SidechainNetworks | Networks;
  private baseTokenWrappers: IBaseTokenWrappers = {};

  constructor(
    env: Environments,
    customProviderUrl?: string,
    privateKey?: string,
    customProvider?: Web3Provider,
    apiUrl?: string
  ) {
    if (!Object.values(Environments).includes(env)) {
      throw new Error(`Invalid environment: ${env}`);
    }
    this.environment = env;
    this.network = getNetwork(this.environment);

    let providerUrl;
    providerUrl = DEFAULT_RPL_URLS[env];

    if (customProviderUrl) {
      providerUrl = customProviderUrl;
    }

    if (privateKey && !isHexString(privateKey)) {
      throw new Error(`${privateKey} is not a valid private key.`);
    } else if (privateKey) {
      // this.provider = new JsonRpcProvider(providerUrl);
      this.provider = new StaticJsonRpcProvider(
        providerUrl,
        CHAIN_IDS[this.network],
      )
      this.signingWallet = new Wallet(privateKey).connect(
        this.provider
      );
      this.privateKey = privateKey;
    } else if (customProvider) {
      this.signingWallet = customProvider.getSigner(0);
      this.provider = customProvider;
    } else {
      throw new Error(`Neither privateKey nor both providers provided.`);
    }

    this.relayerUrl = apiUrl || RELAYER_URLS[env];
  }

  public async cancelOrder(orderHashes: string[]): Promise<IRelayerResponse> {
    this.debug("cancelOrder");
    if (!Array.isArray(orderHashes)) {
      throw new APISchemaError("orderHashes is not an array");
    }
    if (!orderHashes.every((hash) => isHexString(hash))) {
      throw new APISchemaError("orderHashes has some invalid order hashes.");
    }
    const salt = `0x${Buffer.from(randomBytes(32)).toString("hex")}`;
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const cancelOrderPayload = getCancelOrderEIP712Payload(
      orderHashes,
      salt,
      timestamp,
      this.sidechainChainId
    );
    this.debug("Signing payload");
    this.debug(cancelOrderPayload);
    const signature = await this.getEip712Signature(cancelOrderPayload);
    const payload: ICancelOrderRequest = {
      signature,
      orderHashes,
      salt,
      maker: await this.signingWallet.getAddress(),
      timestamp,
    };
    this.debug("Cancel order payload");
    this.debug(payload);
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.CANCEL_ORDERS}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
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

  public async cancelAllOrders(): Promise<IRelayerResponse> {
    this.debug("cancelAllOrders");
    const salt = `0x${Buffer.from(randomBytes(32)).toString("hex")}`;
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const cancelOrderPayload = getCancelAllOrdersEIP712Payload(
      salt,
      timestamp,
      this.sidechainChainId
    );
    this.debug("Signing payload");
    this.debug(cancelOrderPayload);
    const signature = await this.getEip712Signature(cancelOrderPayload);
    const payload: ICancelAllOrdersRequest = {
      signature,
      salt,
      maker: await this.signingWallet.getAddress(),
      timestamp,
    };
    this.debug("Cancel all orders payload");
    this.debug(payload);
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.CANCEL_ALL_ORDERS}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
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

  public async cancelOrdersByEvent(
    sportXeventId: string
  ): Promise<IRelayerResponse> {
    this.debug("cancelOrderByEvent");
    if (typeof sportXeventId !== "string") {
      throw new APISchemaError("sportXeventId is not a string");
    }
    const salt = `0x${Buffer.from(randomBytes(32)).toString("hex")}`;
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const cancelOrderPayload = getCancelOrderEventsEIP712Payload(
      sportXeventId,
      salt,
      timestamp,
      this.sidechainChainId
    );
    this.debug("Signing payload");
    this.debug(cancelOrderPayload);
    const signature = await this.getEip712Signature(cancelOrderPayload);
    const payload: ICancelEventOrdersRequest = {
      signature,
      sportXeventId,
      salt,
      maker: await this.signingWallet.getAddress(),
      timestamp,
    };
    this.debug("Cancel order event payload");
    this.debug(payload);
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.CANCEL_EVENT_ORDERS}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
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

  public async getPopularMarkets() {
    this.debug("getPopularMarkets");
    const url = `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.POPULAR}`;
    const response = await fetch(url);
    const result = await this.tryParseResponse(
      response,
      "Can't fetch active markets"
    );
    this.debug("Relayer response");
    this.debug(result);
    const { data } = result;
    return data as IMarket[];
  }

  public getRealtimeConnection(): ably.Types.RealtimePromise {
    return this.ably;
  }

  public async init() {
    if (this.initialized) {
      throw new Error("Already initialized");
    }
    this.ably = new ably.Realtime.Promise({
      authUrl: `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.USER_TOKEN}`,
    });
    await new Promise<void>((resolve, reject) => {
      this.ably.connection.on("connected", () => {
        resolve();
      });
      setTimeout(() => reject(), RELAYER_TIMEOUT);
    });
    this.metadata = await this.getMetadata();
    const sidechainNetwork = await this.provider.getNetwork();
    this.sidechainChainId = sidechainNetwork.chainId;
    this.verifyChainIds();
    Object.entries(TOKEN_ADDRESSES[this.network]).map(
      async ([, address]) => {
        this.baseTokenWrappers[address] = new Contract(
          address,
          ChildERC20.abi, 
          this.provider
        );
      }
    );
    this.initialized = true;
    this.debug("Initialized");
  }

  public async getActiveLeagues() {
    this.debug("getLeagues");
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.ACTIVE_LEAGUES}`
    );
    const result = await this.tryParseResponse(response, "Can't fetch leagues");
    this.debug("Relayer response");
    this.debug(result);
    const { data } = result;
    return data as IActiveLeague[];
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

  public async getLiveScores(eventIds: string[]) {
    this.debug("getLiveScores");
    if (
      !Array.isArray(eventIds) ||
      !eventIds.every((eventId) => typeof eventId === "string")
    ) {
      throw new APISchemaError("eventIds is not an array of strings");
    }
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.LIVE_SCORES}`,
      {
        method: "POST",
        body: JSON.stringify({ sportXEventIds: eventIds }),
        headers: { "Content-Type": "application/json" },
      }
    );
    const result = await this.tryParseResponse(
      response,
      "Can't get live scores"
    );
    this.debug("Relayer response");
    this.debug(result);
    const { data } = result;
    return data as ILiveScore[];
  }

  public async getActiveMarkets(
    mainLinesOnly?: boolean,
    eventId?: number,
    leagueId?: string,
    liveOnly?: boolean,
    betGroup?: string
  ): Promise<IMarket[]> {
    this.debug("getActiveMarkets");
    const qs = queryString.stringify({
      ...(mainLinesOnly !== undefined && { onlyMainLine: mainLinesOnly }),
      ...(leagueId !== undefined && { leagueId }),
      ...(eventId !== undefined && { eventId }),
      ...(liveOnly !== undefined && { liveOnly }),
      ...(betGroup !== undefined && { betGroup }),
    });
    const url = `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.ACTIVE_MARKETS}?${qs}`;
    const response = await fetch(url);
    const result = await this.tryParseResponse(
      response,
      "Can't fetch active markets"
    );
    this.debug("Relayer response");
    this.debug(result);
    const {
      data: { markets },
    } = result;
    return markets as IMarket[];
  }

  public async marketLookup(marketHashes: string[]): Promise<IMarket[]> {
    this.debug("marketLookup");
    const payload: IRelayerHistoricalMarketRequest = {
      marketHashes,
    };
    if (
      !Array.isArray(marketHashes) ||
      !marketHashes.every((hash) => isHexString(hash))
    ) {
      throw new APISchemaError("marketHashes is not a hex string ");
    }
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.HISTORICAL_MARKETS}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }
    );
    const result = await this.tryParseResponse(
      response,
      "Can't lookup markets"
    );
    this.debug("Relayer response");
    this.debug(result);
    const { data } = result;
    return data as IMarket[];
  }

  public async newOrder(orders: INewOrder[]) {
    this.debug("newOrder");
    const validation = orders.map(validateINewOrderSchema);
    validation.forEach((val) => {
      if (val !== "OK") {
        throw new APISchemaError(val);
      }
    });
    const walletAddress = await this.signingWallet.getAddress();
    const apiOrders = await Promise.all(
      orders.map(async (order) => {
        const bigNumBetSize = BigNumber.from(order.totalBetSize);
        const salt = BigNumber.from(randomBytes(32)).toString();
        const apiMakerOrder: IRelayerMakerOrder = {
          marketHash: order.marketHash,
          maker: walletAddress,
          totalBetSize: bigNumBetSize.toString(),
          percentageOdds: order.percentageOdds,
          expiry: 2209006800,
          apiExpiry: order.expiry,
          executor: this.metadata.executorAddress,
          baseToken: order.baseToken,
          salt,
          isMakerBettingOutcomeOne: order.isMakerBettingOutcomeOne,
        };
        const signature = await getOrderSignature(
          apiMakerOrder,
          this.signingWallet
        );
        const signedApiMakerOrder: ISignedRelayerMakerOrder = {
          ...apiMakerOrder,
          signature,
        };
        return signedApiMakerOrder;
      })
    );

    this.debug(`New signed orders`);
    this.debug(apiOrders);
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.NEW_ORDER}`,
      {
        method: "POST",
        body: JSON.stringify({ orders: apiOrders }),
        headers: { "Content-Type": "application/json" },
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

  public async fillOrders(
    orders: ISignedRelayerMakerOrder[],
    takerAmounts: string[],
    fillDetailsMetadata?: IFillDetailsMetadata,
    affiliateAddress?: string,
    approveProxyPayload?: IApproveSpenderPayload
  ): Promise<IRelayerResponse> {
    this.debug("fillOrders");
    orders.forEach((order) => {
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
    if (!Array.isArray(takerAmounts)) {
      throw new APISchemaError("takerAmounts is not an array");
    }
    if (!takerAmounts.every((amount) => isPositiveBigNumber(amount))) {
      throw new APISchemaError("takerAmounts has some invalid number strings");
    }
    const fillSalt = BigNumber.from(randomBytes(32));
    const solidityOrders = orders.map(convertToContractOrder);
    const orderHashes = solidityOrders.map(getOrderHash);
    const finalFillDetailsMetadata: IFillDetailsMetadata =
      fillDetailsMetadata || {
        action: "N/A",
        market: "N/A",
        betting: "N/A",
        stake: "N/A",
        odds: "N/A",
        returning: "N/A",
      };
    const fillDetails: IFillDetails = {
      ...finalFillDetailsMetadata,
      fills: {
        orders: orders.map(convertToContractOrder),
        makerSigs: orders.map((order) => order.signature),
        takerAmounts: takerAmounts.map(BigNumber.from),
        fillSalt,
        beneficiary: AddressZero,
      },
    };
    const fillOrderPayload = getFillOrderEIP712Payload(
      fillDetails,
      this.sidechainChainId,
      EIP712_VERSION[this.environment],
      EIP712_FILL_HASHER_ADDRESSES[this.environment]
    );
    this.debug(`EIP712 payload`);
    this.debug(fillOrderPayload);
    const takerSignature = await this.getEip712Signature(fillOrderPayload);
    const payload: IRelayerMetaFillOrderRequest = {
      orderHashes,
      takerAmounts,
      taker: await this.signingWallet.getAddress(),
      takerSig: takerSignature,
      fillSalt: fillSalt.toString(),
      ...finalFillDetailsMetadata,
      affiliateAddress,
      approveProxyPayload,
    };
    if (approveProxyPayload) {
      this.debug(`approveProxyPayload`);
      this.debug(approveProxyPayload);
    }
    this.debug("Meta fill payload");
    this.debug(payload);
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.FILL_ORDERS}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }
    );
    const result = await this.tryParseResponse(response, "Can't fill orders.");
    this.debug("Relayer response");
    this.debug(result);
    return result as IRelayerResponse;
  }

  public async getPendingOrFailedBets(
    request: IPendingBetsRequest
  ): Promise<IPendingBet[]> {
    this.debug("getRecentPendingBets");
    const validation = validateIGetPendingBetsRequest(request);
    if (validation !== "OK") {
      throw new APISchemaError(validation);
    }
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.PENDING_BETS}`,
      {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const result = await this.tryParseResponse(
      response,
      "Can't get recent pending bets"
    );
    this.debug("Relayer response");
    this.debug(result);
    const {
      data: { bets },
    } = result;
    const pendingBets: IPendingBet[] = bets;
    return pendingBets;
  }

  public async getTrades(
    tradeRequest: IGetTradesRequest
  ): Promise<ITradesResponse> {
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
        headers: { "Content-Type": "application/json" },
      }
    );
    const result = await this.tryParseResponse(response, "Can't get trades");
    this.debug("Relayer response");
    this.debug(result);
    const { data } = result;
    return data as ITradesResponse;
  }

  public async getOrders(
    marketHashes?: string[],
    maker?: string,
    baseToken?: string
  ): Promise<IDetailedRelayerMakerOrder[]> {
    this.debug("getOrders");
    if (marketHashes && !marketHashes.every((hash) => isHexString(hash))) {
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
      ...(baseToken && { baseToken }),
    };
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.ORDERS}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const result = await this.tryParseResponse(response, "Can't get orders");
    this.debug("Relayer response");
    this.debug(result);
    const { data } = result;
    const orders: IDetailedRelayerMakerOrder[] = data;
    return orders;
  }

  public async approveSportXContracts(token: string) {
    const tokenContract = new Contract(
      token,
      ChildToken.abi, 
      this.signingWallet
    )
    const approvalTxn = await tokenContract.approve(
      TOKEN_TRANSFER_PROXY_ADDRESS[this.environment],
      MaxUint256,
    );
    this.debug("Approval Txn response");
    this.debug(approvalTxn);
    return approvalTxn;
  }

  public async getEip712Signature(payload: any) {
    if (this.privateKey) {
      const bufferPrivateKey = Buffer.from(this.privateKey.substring(2), "hex");
      const signature: string = (ethSigUtil as any).signTypedData_v4(
        bufferPrivateKey,
        { data: payload }
      );
      return signature;
    } else if (
      (this.provider as any)._web3Provider.isMetaMask === true
    ) {
      const walletAddress = await this.signingWallet.getAddress();
      const signature: string = await this.provider.send(
        "eth_signTypedData_v4",
        [walletAddress, JSON.stringify(payload)]
      );
      return signature;
    } else {
      const walletAddress = await this.signingWallet.getAddress();
      const signature: string = await this.provider.send(
        "eth_signTypedData",
        [walletAddress, payload]
      );
      return signature;
    }
  }

  private async tryParseResponse(response: Response, errorMessage: string) {
    const textResponse = await response.text();
    const { result, valid } = tryParseJson(textResponse);
    if (valid && response.status !== 200) {
      this.debug(response.status);
      this.debug(response.statusText);
      this.debug(result);
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

  private verifyChainIds() {
    if (this.environment === Environments.PRODUCTION) {
      if (this.sidechainChainId !== CHAIN_IDS[SidechainNetworks.MAIN_MATIC]) {
        throw new Error(
          `Incorrect sidechain chain ID for production environment. Are you sure the passed sidechain provider is pointing to Polygon mainnet?`
        );
      }
    } else if (this.environment === Environments.MUMBAI) {
      if (this.sidechainChainId !== CHAIN_IDS[SidechainNetworks.MUMBAI_MATIC]) {
        throw new Error(
          `Incorrect sidechain chain ID for mumbai environment. Are you sure the passed sidechain provider is pointing to Mumbai?`
        );
      }
    } else if (this.environment === Environments.SxToronto) {
      if (this.sidechainChainId !== CHAIN_IDS[Networks.SX_TORONTO]) {
        throw new Error(
          `Incorrect sidechain chain ID for sx_toronto environment. Are you sure the passed sidechain provider is pointing to Toronto?`
        );
      }
    }
  }
}

export async function newSportX(
  env: Environments,
  customSidechainProviderUrl?: string,
  privateKey?: string,
  sidechainProvider?: Web3Provider,
  apiUrl?: string
) {
  const sportX = new SportX(
    env,
    customSidechainProviderUrl,
    privateKey,
    sidechainProvider,
    apiUrl
  );
  await sportX.init();
  return sportX;
}
