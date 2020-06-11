import { BigNumber } from "ethers/utils";

export interface IContractOrder {
  marketHash: string;
  maker: string;
  totalBetSize: BigNumber;
  percentageOdds: BigNumber;
  expiry: BigNumber;
  baseToken: string;
  salt: BigNumber;
  executor: string;
  isMakerBettingOutcomeOne: boolean;
}

export interface IPermit {
  holder: string;
  spender: string;
  nonce: number;
  expiry: number;
  allowed: boolean;
}

export interface IPermitSignature extends IPermit {
  signature: string;
}

export interface IFillDetailsMetadata {
  action: string;
  market: string;
  betting: string;
  stake: string;
  odds: string;
  returning: string;
}

export interface IFillDetails extends IFillDetailsMetadata {
  fills: IFillObject;
}

export interface IFillObject {
  orders: IContractOrder[];
  makerSigs: string[];
  takerAmounts: BigNumber[];
  fillSalt: BigNumber;
}

export interface ICancelDetails {
  message: string;
  orders: string[];
}
