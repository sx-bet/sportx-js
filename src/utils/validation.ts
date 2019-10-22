import { utils } from "ethers";
import { Zero } from "ethers/constants";
import { bigNumberify, isHexString } from "ethers/utils";
import _ from "lodash";
import moment from "moment";
import { isBoolean } from "util";
import { FRACTION_DENOMINATOR } from "../constants";
import { INewOrder, IRelayerMakerOrder } from "../types/relayer";
import { convertToAPIPercentageOdds } from "./convert";

export function validateIRelayerMakerOrder(order: IRelayerMakerOrder) {
  const {
    marketHash,
    maker,
    totalBetSize,
    percentageOdds,
    expiry,
    relayerTakerFee,
    executor,
    relayerMakerFee,
    relayer,
    salt,
    isMakerBettingOutcomeOne
  } = order;
  if (!isHexString(marketHash)) {
    return "marketHash is not a valid hex string";
  }
  if (!isAddress(maker)) {
    return "maker is not a valid address";
  }
  if (!isPositiveBigNumber(totalBetSize)) {
    return "totalBetSize as a number is not non-negative";
  }
  if (!isPositiveBigNumber(percentageOdds)) {
    return "percentageOdds as a number is not positive";
  }
  const bigNumPercentageOdds = bigNumberify(percentageOdds);
  if (bigNumPercentageOdds.gte(FRACTION_DENOMINATOR)) {
    return `percentageOdds must be less than ${FRACTION_DENOMINATOR.toString()}`;
  }
  if (moment.unix(parseInt(expiry, 10)).isBefore(moment())) {
    return "expiry before current time.";
  }
  if (!isNonNegativeBigNumber(relayerMakerFee)) {
    return "relayerMakerFee as a number is not non-negative";
  }
  if (!isNonNegativeBigNumber(relayerTakerFee)) {
    return "relayerTakerFee as a number is not non-negative";
  }
  if (!isAddress(executor)) {
    return "executor is not a valid address";
  }
  if (!isAddress(relayer)) {
    return "relayer is not a valid address";
  }
  if (!isPositiveBigNumber(salt)) {
    return "salt as a number is not positive";
  }
  if (!isBoolean(isMakerBettingOutcomeOne)) {
    return "isMakingBettingOutcomeOne undefined or malformed.";
  }
  return "OK";
}

export function validateINewOrderSchema(order: INewOrder) {
  if (!_.isNumber(order.expiry) || order.expiry < 0) {
    return "Expiry undefined or malformed.";
  }
  if (moment.unix(order.expiry).isBefore(moment())) {
    return "Expiry before current time.";
  }
  if (!isPositiveBigNumber(order.totalBetSize)) {
    return "totalBetSize undefined or malformed.";
  }
  if (
    !isPositiveBigNumber(order.percentageOdds) ||
    bigNumberify(order.percentageOdds).gte(convertToAPIPercentageOdds(1))
  ) {
    return "impliedOdds must be between 0 and 1 exclusive.";
  }
  if (!isHexString(order.marketHash)) {
    return "marketHash undefined or malformed.";
  }
  if (!_.isBoolean(order.isMakerBettingOutcomeOne)) {
    return "isMakerBettingOutcomeOne undefined or malformed.";
  }
  return "OK";
}

/**
 * Checks if an object is a ethers.BigNumber and greater than zero
 * Implicitly checks if the object is undefined.
 * @param object Any object
 */
export function isPositiveBigNumber(object: any): boolean {
  try {
    const bigNumber = bigNumberify(object);
    return bigNumber.gt(Zero);
  } catch (e) {
    return false;
  }
}

function isNonNegativeBigNumber(object: any): boolean {
  try {
    const bigNumber = bigNumberify(object);
    return bigNumber.gte(Zero);
  } catch (e) {
    return false;
  }
}

export function isAddress(object: any) {
  try {
    utils.getAddress(object);
    return true;
  } catch (e) {
    return false;
  }
}
