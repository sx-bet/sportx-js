import { IApproveSpenderPayload, ICancelDetails } from "./internal.js";

export interface IRelayerMakerOrder {
  marketHash: string;
  baseToken: string;
  maker: string;
  totalBetSize: string;
  percentageOdds: string;
  expiry: number;
  apiExpiry: number;
  executor: string;
  salt: string;
  isMakerBettingOutcomeOne: boolean;
}

export interface ISignedRelayerMakerOrder extends IRelayerMakerOrder {
  signature: string;
}

export interface IRelayerCancelOrderRequest extends ICancelDetails {
  message: string;
  orders: string[];
  cancelSignature: string;
}

export interface IRelayerMarketOrderRequest {
  marketHash: string;
  takerPayAmount: string;
  takerDirection: "outcomeOne" | "outcomeTwo";
  taker: string;
  baseToken: string;
}

export interface IRelayerHistoricalMarketRequest {
  marketHashes: string[];
}

export interface IGetTradesRequest {
  startDate?: number;
  endDate?: number;
  bettor?: string;
  settled?: boolean;
  marketHashes?: string[];
  baseToken?: string;
  maker?: boolean;
  affiliate?: string;
  pageSize?: number;
  paginationKey?: string;
}

export interface IPendingBetsRequest {
  bettor: string;
  startDate?: number;
  endDate?: number;
  fillHash?: string;
  baseToken?: string;
}

export interface IRelayerMetaFillOrderRequest {
  orderHashes: string[];
  takerAmounts: string[];
  taker: string;
  takerSig: string;
  fillSalt: string;
  action: string;
  market: string;
  betting: string;
  stake: string;
  odds: string;
  returning: string;
  affiliateAddress?: string;
  approveProxyPayload?: IApproveSpenderPayload;
}

export interface IDetailedRelayerMakerOrder extends ISignedRelayerMakerOrder {
  orderHash: string;
  fillAmount: string;
}

export interface IRelayerActiveOrders {
  [marketHash: string]: IDetailedRelayerMakerOrder[];
}

export interface IRelayerResponse {
  status: string;
  data?: any;
  reason?: string;
}

export interface IMetadata {
  executorAddress: string;
  oracleFees: {
    [token: string]: string;
  };
  sportXAffiliate: {
    address: string;
    amount: string;
  };
  makerOrderMinimums: {
    [token: string]: string;
  };
  takerMinimums: {
    [token: string]: string;
  };
  addresses: {
    [network: string]: { [token: string]: string };
  };
  bettingEnabled: boolean;
  depositMinimums: {
    [token: string]: string;
  };
  withdrawMinimums: {
    [token: string]: string;
  };
  totalVolume: number;
}

export interface ILeague {
  leagueId: number;
  label: string;
  sportId: number;
  homeTeamFirst: boolean;
}

export interface ILiveScore {
  currentPeriod: string;
  extra: string;
  leagueId: number;
  periodTime: string;
  periods: IPeriod[];
  sportId: number;
  teamOneScore: number;
  teamTwoScore: number;
  updatedAt: string;
  sportXeventId: string;
}

export interface IPeriod {
  label: string;
  isFinished: boolean;
  teamOneScore: string;
  teamTwoScore: string;
}

export interface IActiveLeague {
  leagueId: number;
  label: string;
  sportId: number;
  homeTeamFirst: boolean;
  eventsByType: { [group: string]: number };
}

export interface ISport {
  sportId: number;
  label: string;
}

export interface INewOrder {
  marketHash: string;
  totalBetSize: string;
  percentageOdds: string;
  baseToken: string;
  expiry: number;
  isMakerBettingOutcomeOne: boolean;
}

export interface ITrade {
  baseToken: string;
  bettor: string;
  stake: string;
  odds: string;
  orderHash: string;
  marketHash: string;
  maker: boolean;
  betTime: number;
  bettingOutcomeOne: boolean;
  settled: boolean;
}

export interface ITradesResponse {
  trades: ITrade[];
  nextKey: string;
  pageSize: number;
}

export enum BetStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAIL = "FAIL",
  TIMEOUT = "TIMEOUT"
}

export interface IPendingBet {
  taker: string;
  fillAmounts: string[];
  orderHashes: string[];
  status: BetStatus;
  betTime: number;
  fillHash: string;
  baseToken: string;
}

export interface IMarket {
  status: string;
  marketHash: string;
  outcomeOneName: string;
  outcomeTwoName: string;
  outcomeVoidName: string;
  teamOneName: string;
  teamTwoName: string;
  type: string;
  gameTime: number;
  line?: number;
  reportedDate?: number;
  outcome?: number;
  teamOneScore?: number;
  teamTwoScore?: number;
  teamOneMeta?: string;
  teamTwoMeta?: string;
  marketMeta?: string;
  sportXeventId: string;
  sportLabel: string;
  sportId: number;
  leagueId: number;
  homeTeamFirst: boolean;
  leagueLabel: string;
  mainLine?: boolean;
  group1: string;
  group2?: string;
  group3?: string;
}
