import { RELAYER_SOCKET_MESSAGE_KEYS } from "../constants";
import { ISignedRelayerNewMakerOrder } from "./internal";

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
export interface IAPIResponse {
  status: string;
  data?: any;
  reason?: string;
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

export interface IAPIOrder extends ISignedRelayerNewMakerOrder {
  orderHash: string;
  fillAmount: string;
}

export interface IAPIActiveOrders {
  [marketHash: string]: IAPIOrder[];
}

export const APIEventKeys = {
  MARKET_ORDER_BOOK: RELAYER_SOCKET_MESSAGE_KEYS.MARKET_ORDER_BOOK,
  ACTIVE_ORDERS: RELAYER_SOCKET_MESSAGE_KEYS.ACTIVE_ORDERS
};
