import { BigNumber } from "ethers/utils";

export interface IContractOrder {
  marketHash: string;
  maker: string;
  totalBetSize: BigNumber;
  percentageOdds: BigNumber;
  expiry: BigNumber;
  relayer: string;
  relayerMakerFee: BigNumber;
  relayerTakerFee: BigNumber;
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
