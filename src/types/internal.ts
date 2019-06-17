import { BigNumber } from "ethers/utils";

export interface IRelayerNewMakerOrder {
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

export interface ISignedRelayerNewMakerOrder extends IRelayerNewMakerOrder {
  signature: string;
}

export interface IRelayerCancelOrderRequest {
  orderHashes: string[];
  cancelSignature: string;
}

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
