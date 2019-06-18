import { utils } from "ethers";
import { Zero } from "ethers/constants";
import { bigNumberify, isHexString } from "ethers/utils";
import _ from "lodash";
import moment from "moment";
import { FRACTION_DENOMINATOR } from "../constants";
import { convertToAPIPercentageOdds } from "./convert";

export function validateOrderHashArray(orderHashes: any) {
  if (!_.isArray(orderHashes)) {
    return "orderHashes is not an array";
  }
  orderHashes.forEach(hash => {
    if (!isHexString(hash)) {
      return `${hash} is not a hex string.`;
    }
  });
  return "OK";
}

export function validateIAPIOrderSchema(order: any) {
  if (!isAddress(order.executor)) {
    return "executor is not a valid address";
  }
  if (!_.isNumber(order.expiry) || order.expiry < 0) {
    return "expiry undefined or malformed";
  }
  if (moment.unix(order.expiry).isBefore(moment())) {
    return "expiry before current time.";
  }
  if (!isPositiveBigNumber(order.fillAmount)) {
    return "fillAmount as a number is not positive";
  }
  if (!_.isBoolean(order.isMakerBettingOutcomeOne)) {
    return "isMakingBettingOutcomeOne undefined or malformed.";
  }
  if (!isAddress(order.maker)) {
    return "maker is not a valid address";
  }
  if (!isHexString(order.marketHash)) {
    return "marketHash is not a valid hash";
  }
  if (!isHexString(order.orderHash)) {
    return "orderHash is not a valid hash";
  }
  if (!isPositiveBigNumber(order.percentageOdds)) {
    return "percentageOdds as a number is not positive";
  }
  const bigNumPercentageOdds = bigNumberify(order.percentageOdds);
  if (bigNumPercentageOdds.gte(FRACTION_DENOMINATOR)) {
    return `percentageOdds must be less than ${FRACTION_DENOMINATOR.toString()}`;
  }
  if (!isAddress(order.relayer)) {
    return "relayer is not a valid address";
  }
  if (!isNonNegativeBigNumber(order.relayerMakerFee)) {
    return "relayerMakerFee as a number is not non-negative";
  }
  if (!isNonNegativeBigNumber(order.relayerTakerFee)) {
    return "relayerTakerFee as a number is not non-negative";
  }
  if (!isPositiveBigNumber(order.salt)) {
    return "salt as a number is not positive";
  }
  if (!isHexString(order.signature)) {
    return "signature is not a valid hash";
  }
  if (!isPositiveBigNumber(order.totalBetSize)) {
    return "totalBetSize as a number is not non-negative";
  }
  return "OK";
}

export function validateINewOrderSchema(order: any) {
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
function isPositiveBigNumber(object: any): boolean {
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
