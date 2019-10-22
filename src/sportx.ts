import debug from "debug";
import { utils, Wallet } from "ethers";
import { Zero } from "ethers/constants";
import {
  bigNumberify,
  formatUnits,
  isHexString,
  randomBytes
} from "ethers/utils";
import { EventEmitter } from "events";
import fetch from "node-fetch";
import io from "socket.io-client";
import { isArray, isBoolean } from "util";
import {
  Environments,
  PRODUCTION_RELAYER_URL,
  RELAYER_HTTP_ENDPOINTS,
  RELAYER_SOCKET_MESSAGE_KEYS,
  RELAYER_TIMEOUT,
  RINKEBY_RELAYER_URL
} from "./constants";
import { APIError } from "./errors/api_error";
import { APITimeoutError } from "./errors/api_timeout_error";
import { APISchemaError } from "./errors/schema_error";
import {
  IDetailedRelayerMakerOrder,
  ILeague,
  IMarket,
  IMetadata,
  INewOrder,
  IPendingBet,
  IRelayerActiveOrders,
  IRelayerCancelOrderRequest,
  IRelayerMakerOrder,
  IRelayerMarketOrderRequest,
  IRelayerMetaFillOrderRequest,
  IRelayerResponse,
  ISignedRelayerMakerOrder,
  ISport,
  RelayerEventKeys
} from "./types/relayer";
import { convertToContractOrder } from "./utils/convert";
import {
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
  getActiveMarkets(): Promise<IMarket[]>;
  newOrder(order: INewOrder): Promise<IRelayerResponse>;
  cancelOrder(orderHashes: string[]): Promise<IRelayerResponse>;
  getRecentPendingBets(address: string): Promise<IPendingBet[]>;
  getOrders(marketHash: string): Promise<IDetailedRelayerMakerOrder[]>;
  getActiveOrders(account: string): Promise<IDetailedRelayerMakerOrder[]>;
  subscribeMarket(marketHash: string): Promise<IRelayerResponse>;
  fillOrders(
    orders: IRelayerMakerOrder[],
    takerAmounts: string[]
  ): Promise<IRelayerResponse>;
  unsubscribeMarket(marketHash: string): Promise<IRelayerResponse>;
  subscribeAccount(account: string): Promise<IRelayerResponse>;
  suggestOrders(
    marketHash: string,
    betSize: string,
    takerDirectionOutcomeOne: boolean,
    taker: string
  ): Promise<IRelayerResponse>;
  unsubscribeAccount(account: string): Promise<IRelayerResponse>;
}

class SportX extends EventEmitter implements ISportX {
  private signingWallet: Wallet;
  private relayerUrl: string;
  private initialized: boolean = false;
  private clientSocket!: SocketIOClient.Socket;
  private debug = debug("sportx-js");
  private metadata!: IMetadata;
  private subscribedMarketHashes: string[] = [];
  private subscribedAccounts: string[] = [];

  constructor(env: Environments, privateKey: string) {
    super();
    if (!isHexString(privateKey)) {
      throw new Error(`${privateKey} is not a valid private key.`);
    }
    this.signingWallet = new Wallet(privateKey);
    if (env === Environments.PRODUCTION) {
      this.relayerUrl = PRODUCTION_RELAYER_URL;
    } else if (env === Environments.RINKEBY) {
      this.relayerUrl = RINKEBY_RELAYER_URL;
    } else {
      throw new Error(`Invalid environment: ${env}`);
    }
  }

  public async init() {
    if (this.initialized) {
      throw new Error("Already initialized");
    }
    await new Promise((resolve, reject) => {
      this.clientSocket = io(this.relayerUrl, { transports: ["websocket"] });
      this.clientSocket.on("connect", () => {
        resolve();
        setTimeout(
          () => reject(new Error("Timeout connecting to the SportX API")),
          RELAYER_TIMEOUT
        );
      });
    });
    this.initialized = true;
    this.metadata = await this.getMetadata();
    this.clientSocket.on(
      RELAYER_SOCKET_MESSAGE_KEYS.MARKET_ORDER_BOOK,
      (data: IDetailedRelayerMakerOrder[]) => {
        this.emit(RelayerEventKeys.MARKET_ORDER_BOOK, data);
      }
    );
    this.clientSocket.on(
      RELAYER_SOCKET_MESSAGE_KEYS.ACTIVE_ORDERS,
      (data: IRelayerActiveOrders) => {
        this.emit(RelayerEventKeys.ACTIVE_ORDERS, data);
      }
    );
    this.debug("Initialized");
  }

  public async getMetadata(): Promise<IMetadata> {
    this.debug("getMetadata");
    const metadata = await new Promise((resolve, reject) => {
      this.clientSocket.on(
        RELAYER_SOCKET_MESSAGE_KEYS.METADATA,
        (data: IMetadata) => {
          this.debug("Got metadata");
          this.debug(data);
          resolve(data);
        }
      );
      this.clientSocket.emit(
        RELAYER_SOCKET_MESSAGE_KEYS.METADATA,
        null,
        (response: any) => {
          if (response.status !== "success") {
            reject(new Error("Error getting metadata from the SportX API"));
          }
        }
      );
      setTimeout(
        () =>
          reject(
            new APITimeoutError("Timeout getting metadata from the SportX API")
          ),
        RELAYER_TIMEOUT
      );
    });
    return metadata as IMetadata;
  }

  public async getLeagues(): Promise<ILeague[]> {
    this.debug("getLeagues");
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.LEAGUES}`
    );
    const { data } = await response.json();
    this.debug("Got leagues");
    this.debug(data);
    return data as ILeague[];
  }

  public async getSports(): Promise<ISport[]> {
    this.debug("getSports");
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.SPORTS}`
    );
    const { data } = await response.json();
    this.debug("Got sports");
    this.debug(data);
    return data as ISport[];
  }

  public async getActiveMarkets(): Promise<IMarket[]> {
    this.debug("getActiveMarkets");
    const markets = await new Promise((resolve, reject) => {
      this.clientSocket.on(
        RELAYER_SOCKET_MESSAGE_KEYS.ACTIVE_MARKETS,
        (data: IMarket[]) => {
          this.debug("Got active markets");
          this.debug(data);
          resolve(data);
        }
      );
      this.clientSocket.emit(
        RELAYER_SOCKET_MESSAGE_KEYS.ACTIVE_MARKETS,
        null,
        (response: any) => {
          if (response.status !== "success") {
            reject(
              new Error(
                `Error getting active markets. Reason: ${response.reason}`
              )
            );
          }
          setTimeout(
            () =>
              reject(
                new APITimeoutError(
                  "Timeout getting active markets from the SportX API"
                )
              ),
            RELAYER_TIMEOUT
          );
        }
      );
    });
    return markets as IMarket[];
  }

  public async newOrder(order: INewOrder) {
    this.debug("newOrder");
    const schemaValidation = validateINewOrderSchema(order);
    if (schemaValidation !== "OK") {
      throw new APISchemaError(schemaValidation);
    }
    const bigNumBetSize = bigNumberify(order.totalBetSize);
    const makerOrderMinimumBigNum = bigNumberify(
      this.metadata.makerOrderMinimum
    );
    if (bigNumBetSize.lt(makerOrderMinimumBigNum)) {
      throw new APISchemaError(
        `totalBetSize below API minimum of ${formatUnits(
          makerOrderMinimumBigNum,
          18
        )}`
      );
    }
    const salt = bigNumberify(randomBytes(32)).toString();
    const apiMakerOrder: IRelayerMakerOrder = {
      marketHash: order.marketHash,
      maker: this.signingWallet.address,
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
    const status = await new Promise((resolve, reject) => {
      this.clientSocket.emit(
        RELAYER_SOCKET_MESSAGE_KEYS.NEW_ORDER,
        signedApiMakerOrder,
        (response: IRelayerResponse) => {
          this.debug("Response from relayer for new order");
          this.debug(response);
          if (response.status === "success") {
            resolve(response);
          } else {
            reject(
              new APIError(
                `Unable to create new order. Status: ${
                  response.status
                }. Reason: ${response.reason}`
              )
            );
          }
        }
      );
      setTimeout(
        () =>
          reject(
            new APITimeoutError(
              "Timeout getting submitting order to the SportX API"
            )
          ),
        RELAYER_TIMEOUT
      );
    });
    return status as IRelayerResponse;
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
    const status = await new Promise((resolve, reject) => {
      this.clientSocket.emit(
        RELAYER_SOCKET_MESSAGE_KEYS.MARKET_ORDER,
        payload,
        (response: IRelayerResponse) => {
          this.debug("Response from relayer for suggest orders");
          this.debug(response);
          if (response.status === "success") {
            resolve(response);
          } else {
            reject(
              new APIError(
                `Unable to cancel order. Status: ${response.status}. Reason: ${
                  response.reason
                }`
              )
            );
          }
        }
      );
      setTimeout(
        () =>
          reject(
            new APITimeoutError(
              "Timeout getting submitting order to the SportX API"
            )
          ),
        RELAYER_TIMEOUT
      );
    });
    return status as IRelayerResponse;
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
      taker: this.signingWallet.address,
      takerSig: takerSignature,
      fillSalt: fillSalt.toString(),
      submitterFee: submitterFee.toString()
    };
    const status = await new Promise((resolve, reject) => {
      this.clientSocket.emit(
        RELAYER_SOCKET_MESSAGE_KEYS.META_FILL_ORDER,
        payload,
        (response: IRelayerResponse) => {
          if (response.status === "success") {
            resolve(response);
          } else {
            reject(
              new APIError(
                `Unable to fill order. Status: ${response.status}. Reason: ${
                  response.reason
                }`
              )
            );
          }
        }
      );
      setTimeout(
        () =>
          reject(
            new APITimeoutError(
              "Timeout getting submitting order to the SportX API"
            )
          ),
        RELAYER_TIMEOUT
      );
    });
    return status as IRelayerResponse;
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
    const status = await new Promise((resolve, reject) => {
      this.clientSocket.emit(
        RELAYER_SOCKET_MESSAGE_KEYS.CANCEL_ORDER,
        payload,
        (response: IRelayerResponse) => {
          if (response.status === "success") {
            resolve(response);
          } else {
            reject(
              new APIError(
                `Unable to cancel order. Status: ${response.status}. Reason: ${
                  response.reason
                }`
              )
            );
          }
        }
      );
      setTimeout(
        () =>
          reject(
            new APITimeoutError(
              "Timeout getting submitting order to the SportX API"
            )
          ),
        RELAYER_TIMEOUT
      );
    });
    return status as IRelayerResponse;
  }

  public async getRecentPendingBets(address: string): Promise<IPendingBet[]> {
    this.debug("getRecentPendingBets");
    if (!isAddress(address)) {
      throw new APISchemaError(`Address ${address} is not a valid address`);
    }
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.PENDING_BETS}/${address}`
    );
    const { data } = await response.json();
    const pendingBets: IPendingBet[] = data;
    return pendingBets;
  }

  public async getOrders(marketHash: string): Promise<IDetailedRelayerMakerOrder[]> {
    this.debug("getOrders");
    if (!isHexString(marketHash)) {
      throw new APISchemaError(
        `Market hash ${marketHash} is not a valid hash string.`
      );
    }
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.ORDERS}/${marketHash}`
    );
    const { data } = await response.json();
    const orders: IDetailedRelayerMakerOrder[] = data;
    return orders;
  }

  public async getActiveOrders(account: string): Promise<IDetailedRelayerMakerOrder[]> {
    this.debug("getActiveOrders");
    if (!isAddress(account)) {
      throw new APISchemaError(`Address ${account} is not a valid address`);
    }
    const response = await fetch(
      `${this.relayerUrl}${RELAYER_HTTP_ENDPOINTS.ACTIVE_ORDERS}/${account}`
    );
    const { data } = await response.json();
    const orders: IDetailedRelayerMakerOrder[] = data;
    return orders;
  }

  public async subscribeMarket(marketHash: string): Promise<IRelayerResponse> {
    this.debug("subscribeMarket");
    if (!isHexString(marketHash)) {
      throw new APISchemaError(`${marketHash} is not a valid hash string.`);
    }
    if (this.subscribedMarketHashes.includes(marketHash)) {
      throw new Error(`${marketHash} is already subscribed.`);
    }
    const payload = { marketHash };
    const status = await new Promise((resolve, reject) => {
      this.clientSocket.emit(
        RELAYER_SOCKET_MESSAGE_KEYS.SUBSCRIBE_MARKET,
        payload,
        (response: IRelayerResponse) => {
          if (response.status === "success") {
            resolve(response);
          } else {
            reject(
              new APIError(
                `Unable to subscribe to market ${marketHash}. Status: ${
                  response.status
                }. Reason: ${response.reason}`
              )
            );
          }
          setTimeout(
            () =>
              reject(
                new APITimeoutError(
                  `Timeout subscribing to market ${marketHash}`
                )
              ),
            RELAYER_TIMEOUT
          );
        }
      );
    });
    this.subscribedMarketHashes.push(marketHash);
    return status as IRelayerResponse;
  }

  public async unsubscribeMarket(
    marketHash: string
  ): Promise<IRelayerResponse> {
    this.debug("unsubscribeMarket");
    if (!isHexString(marketHash)) {
      throw new APISchemaError(`${marketHash} is not a valid hash string.`);
    }
    if (!this.subscribedMarketHashes.includes(marketHash)) {
      throw new Error(`${marketHash} is not subscribed.`);
    }
    const payload = { marketHash };
    const status = await new Promise((resolve, reject) => {
      this.clientSocket.emit(
        RELAYER_SOCKET_MESSAGE_KEYS.UNSUBSCRIBE_MARKET,
        payload,
        (response: IRelayerResponse) => {
          if (response.status === "success") {
            resolve(response);
          } else {
            reject(
              new APIError(
                `Unable to unsubscribe to market. Status: ${
                  response.status
                }. Reason: ${response.reason}`
              )
            );
          }
          setTimeout(
            () =>
              reject(
                new APITimeoutError(
                  `Timeout unsubscribing to market ${marketHash}`
                )
              ),
            RELAYER_TIMEOUT
          );
        }
      );
    });
    this.subscribedMarketHashes = this.subscribedMarketHashes.filter(
      hash => hash !== marketHash
    );
    return status as IRelayerResponse;
  }

  public async subscribeAccount(account: string) {
    this.debug("subscribeAccount");
    if (!isAddress(account)) {
      throw new APISchemaError(`${account} is not a valid address.`);
    }
    if (this.subscribedAccounts.includes(account)) {
      throw new Error(`${account} is already subscribed.`);
    }
    const payload = { address: account };
    const status = await new Promise((resolve, reject) => {
      this.clientSocket.emit(
        RELAYER_SOCKET_MESSAGE_KEYS.SUBSCRIBE_ACCOUNT,
        payload,
        (response: IRelayerResponse) => {
          if (response.status === "success") {
            resolve(response);
          } else {
            reject(
              new APIError(
                `Unable to subscribe to account ${account}. Status: ${
                  response.status
                }. Reason: ${response.reason}`
              )
            );
          }
          setTimeout(
            () =>
              reject(
                new APITimeoutError(`Timeout subscribing to account ${account}`)
              ),
            RELAYER_TIMEOUT
          );
        }
      );
    });
    this.subscribedAccounts.push(account);
    return status as IRelayerResponse;
  }

  public async unsubscribeAccount(account: string) {
    this.debug("unsubscribeAccount");
    if (!isAddress(account)) {
      throw new APISchemaError(`${account} is not a valid address`);
    }
    if (!this.subscribedAccounts.includes(account)) {
      throw new Error(`${account} is not subscribed.`);
    }
    const payload = { address: account };
    const status = await new Promise((resolve, reject) => {
      this.clientSocket.emit(
        RELAYER_SOCKET_MESSAGE_KEYS.UNSUBSCRIBE_ACCOUNT,
        payload,
        (response: IRelayerResponse) => {
          if (response.status === "success") {
            resolve(response);
          } else {
            reject(
              new APIError(
                `Unable to unsubscribe to account ${account}. Status: ${
                  response.status
                }. Reason: ${response.reason}`
              )
            );
          }
          setTimeout(
            () =>
              reject(
                new APITimeoutError(
                  `Timeout unsubscribing to account ${account}`
                )
              ),
            RELAYER_TIMEOUT
          );
        }
      );
    });
    this.subscribedAccounts = this.subscribedAccounts.filter(
      acc => acc !== account
    );
    return status as IRelayerResponse;
  }
}

export async function newSportX(env: Environments, privateKey: string) {
  const sportX = new SportX(env, privateKey);
  await sportX.init();
  return sportX;
}
