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
