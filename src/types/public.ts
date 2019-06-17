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
  marketHashes: string[],
  impliedOdds: number[],
  isMakerBettingOutcomeOne: boolean[],
  taker: string,
  fillAmounts: number[],
  orderHashes: string[],
  status: string,
  betTime: number
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
  orderHash: string,
  fillAmount: string
}
