import { BigNumber } from "bignumber.js";
import {
  BigNumber as EthBigNumber,
  bigNumberify,
  formatUnits,
  parseUnits
} from "ethers/utils";
import {
  FRACTION_DENOMINATOR,
  PERCENTAGE_PRECISION_EXPONENT
} from "../constants";
import { IContractOrder } from "../types/internal";
import { IMarket, IRelayerMakerOrder } from "../types/relayer";

export function convertToAPIPercentageOdds(decimal: number): EthBigNumber {
  if (decimal < 0 || decimal > 1) {
    throw new Error(`${decimal} not in valid range. Must be between 0 and 1`);
  }
  const protocolBigNum = decimal * Math.pow(10, 20);
  return bigNumberify(protocolBigNum.toString());
}

export function convertFromAPIPercentageOdds(odds: string): number {
  const apiPercentageOdds = bigNumberify(odds);
  if (apiPercentageOdds.gt(FRACTION_DENOMINATOR)) {
    throw new Error(
      `Invalid api percentage odds. ${apiPercentageOdds} greater than ${bigNumberify(
        10
      )
        .pow(PERCENTAGE_PRECISION_EXPONENT)
        .toString()}`
    );
  }
  const bigNumWithDecimals = new BigNumber(apiPercentageOdds.toString());
  const impliedOddsWithDecimals = bigNumWithDecimals.dividedBy(
    new BigNumber(10).exponentiatedBy(PERCENTAGE_PRECISION_EXPONENT)
  );
  return impliedOddsWithDecimals.toNumber();
}

export function convertToContractOrder(
  order: IRelayerMakerOrder
): IContractOrder {
  return {
    ...order,
    totalBetSize: bigNumberify(order.totalBetSize),
    percentageOdds: bigNumberify(order.percentageOdds),
    expiry: bigNumberify(order.expiry),
    relayerMakerFee: bigNumberify(order.relayerMakerFee),
    relayerTakerFee: bigNumberify(order.relayerTakerFee),
    salt: bigNumberify(order.salt)
  };
}
export function convertToTrueTokenAmount(amount: number) {
  return parseUnits(amount.toString(), 18).toString();
}

export function convertToDisplayAmount(amount: string) {
  return formatUnits(amount, 18);
}

export function getCompactGameId(market: IMarket) {
  return [
    market.sportId,
    market.leagueId,
    market.expiryDate,
    market.teamOneName,
    market.teamTwoName
  ].join(",");
}
