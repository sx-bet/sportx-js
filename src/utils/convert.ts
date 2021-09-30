import { BigNumber as EthBigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import BigNumber from "bignumber.js";
import {
  FRACTION_DENOMINATOR,
  PERCENTAGE_PRECISION_EXPONENT,
  TokenDecimalMapping
} from "../constants.js";
import { IContractOrder } from "../types/internal.js";
import { IRelayerMakerOrder } from "../types/relayer.js";

export function convertToAPIPercentageOdds(decimal: number): EthBigNumber {
  if (decimal < 0 || decimal > 1) {
    throw new Error(`${decimal} not in valid range. Must be between 0 and 1`);
  }
  const protocolBigNum = decimal * Math.pow(10, 20);
  return EthBigNumber.from(protocolBigNum.toString());
}

export function convertFromAPIPercentageOdds(odds: string): number {
  const apiPercentageOdds = EthBigNumber.from(odds);
  if (apiPercentageOdds.gt(FRACTION_DENOMINATOR)) {
    throw new Error(
      `Invalid api percentage odds. ${apiPercentageOdds} greater than ${EthBigNumber.from(
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
    totalBetSize: EthBigNumber.from(order.totalBetSize),
    percentageOdds: EthBigNumber.from(order.percentageOdds),
    expiry: EthBigNumber.from(order.expiry),
    baseToken: order.baseToken,
    salt: EthBigNumber.from(order.salt)
  };
}
export function convertToTrueTokenAmount(amount: number, baseToken: string) {
  return parseUnits(
    amount.toString(),
    TokenDecimalMapping[baseToken]
  ).toString();
}

export function convertToDisplayAmount(amount: string, baseToken: string) {
  return formatUnits(amount, TokenDecimalMapping[baseToken]);
}

export function convertToTakerPayAmount(amount: string, odds: EthBigNumber) {
  return EthBigNumber.from(amount)
    .mul(odds)
    .div(FRACTION_DENOMINATOR.sub(odds));
}
