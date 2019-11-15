import { ISignedRelayerMakerOrder } from "./relayer";

export interface IRelayerMakerOrder {
  marketHash: string;
  maker: string;
  totalBetSize: string;
  percentageOdds: string;
  expiry: string;
  relayerTakerFee: string;
  executor: string;
  relayerMakerFee: string;
  relayer: string;
  salt: string;
  isMakerBettingOutcomeOne: boolean;
}

export interface ISignedRelayerMakerOrder extends IRelayerMakerOrder {
  signature: string;
}

export interface IRelayerCancelOrderRequest {
  orderHashes: string[];
  cancelSignature: string;
}

export interface IRelayerMarketOrderRequest {
  marketHash: string;
  takerPayAmount: string;
  takerDirection: "outcomeOne" | "outcomeTwo";
  taker: string;
}

export interface IRelayerMetaFillOrderRequest {
  orderHashes: string[];
  takerAmounts: string[];
  taker: string;
  takerSig: string;
  fillSalt: string;
  submitterFee: string;
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
  relayerAddress: string;
  executorAddress: string;
  fees: {
    relayerMakerFee: string;
    relayerTakerFee: string;
  };
  oracleFees: {
    DAI: string;
  };
  makerOrderMinimum: string;
  takerMinimum: string;
}

export interface ILeague {
  leagueId: number;
  label: string;
  sportId: number;
  referenceUrl: string;
  homeTeamFirst: boolean;
}

export interface ISport {
  sportId: number;
  label: string;
}

export interface INewOrder {
  marketHash: string;
  totalBetSize: string;
  percentageOdds: string;
  expiry: number;
  isMakerBettingOutcomeOne: boolean;
}

export interface IPendingBet {
  marketHashes: string[];
  percentageOdds: string[];
  isMakerBettingOutcomeOne: boolean[];
  taker: string;
  fillAmounts: string[];
  orderHashes: string[];
  status: string;
  betTime: number;
  fillHash: string;
  nonce: number;
}

export interface IMarket {
  status: string;
  marketHash: string;
  baseToken: string;
  startDate: number;
  expiryDate: number;
  title: string;
  outcomeOneName: string;
  outcomeTwoName: string;
  outcomeVoidName: string;
  teamOneName: string;
  teamTwoName: string;
  sportId: number;
  leagueId: number;
  type: string;
  line?: number;
  reportedOnBlockchain: boolean;
  reportedDate?: number;
  outcome?: number;
  teamOneScore?: number;
  teamTwoScore?: number;
  teamOneMeta?: string;
  teamTwoMeta?: string;
  marketMeta?: string;
  sportLabel?: string;
  homeTeamFirst?: boolean;
  leagueLabel?: string;
}
