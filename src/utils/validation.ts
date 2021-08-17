import { isAddress } from "@ethersproject/address";
import { BigNumber } from "@ethersproject/bignumber";
import { isHexString } from "@ethersproject/bytes";
import * as constants from "@ethersproject/constants";
import { FRACTION_DENOMINATOR } from "../constants";
import { IFillDetailsMetadata } from "../types/internal";
import {
  IGetTradesRequest,
  INewOrder,
  IPendingBetsRequest,
  IRelayerMakerOrder,
  ISignedRelayerMakerOrder
} from "../types/relayer";
import { convertToAPIPercentageOdds } from "./convert";

export function validateIGetPendingBetsRequest(payload: IPendingBetsRequest) {
  const { bettor, startDate, endDate, fillHash, baseToken } = payload;
  if (
    startDate !== undefined &&
    (typeof startDate !== "number" ||
      startDate < 0 ||
      !Number.isInteger(startDate))
  ) {
    return "invalid startDate";
  }
  if (
    endDate !== undefined &&
    (typeof endDate !== "number" || endDate < 0 || !Number.isInteger(endDate))
  ) {
    return "invalid endDate";
  }
  if (!isAddress(bettor)) {
    return "invalid bettor";
  }
  if (fillHash !== undefined && !isHexString(fillHash)) {
    return "invalid fillHash";
  }
  if (baseToken !== undefined && !isHexString(baseToken)) {
    return "invalid baseToken";
  }
  return "OK";
}

export function validateIGetTradesRequest(payload: IGetTradesRequest) {
  const {
    startDate,
    endDate,
    bettor,
    settled,
    marketHashes,
    baseToken,
    maker,
    affiliate,
    pageSize,
    paginationKey
  } = payload;
  if (
    startDate !== undefined &&
    (typeof startDate !== "number" ||
      startDate < 0 ||
      !Number.isInteger(startDate))
  ) {
    return "invalid startDate";
  }
  if (
    endDate !== undefined &&
    (typeof endDate !== "number" || endDate < 0 || !Number.isInteger(endDate))
  ) {
    return "invalid endDate";
  }
  if (
    startDate !== undefined &&
    endDate !== undefined &&
    startDate >= endDate
  ) {
    return "startDate not before endDate";
  }
  if (bettor !== undefined && !isAddress(bettor)) {
    return "invalid bettor";
  }
  if (settled !== undefined && typeof settled !== "boolean") {
    return "invalid settled";
  }
  if (maker !== undefined && typeof maker !== "boolean") {
    return "invalid maker";
  }
  if (marketHashes !== undefined && !Array.isArray(marketHashes)) {
    return "invalid marketHashes";
  }
  if (baseToken !== undefined && !isAddress(baseToken)) {
    return "invalid baseToken";
  }
  if (
    marketHashes !== undefined &&
    !marketHashes.every(hash => typeof hash === "string")
  ) {
    return "invalid marketHashes";
  }
  if (affiliate !== undefined && typeof affiliate !== "string") {
    return "invalid affiliate";
  }
  if (pageSize !== undefined && typeof pageSize !== "number") {
    return "invalid pageSize";
  }
  if (paginationKey !== undefined && typeof paginationKey !== "string") {
    return "invalid paginationKey";
  }
  return "OK";
}

export function validateIFillDetailsMetadata(metadata: IFillDetailsMetadata) {
  const { action, market, betting, stake, odds, returning } = metadata;
  if (typeof action !== "string") {
    return "action is not a string";
  }
  if (typeof market !== "string") {
    return "market is not a string";
  }
  if (typeof betting !== "string") {
    return "betting is not a string";
  }
  if (typeof stake !== "string") {
    return "stake is not a string";
  }
  if (typeof odds !== "string") {
    return "odds is not a string";
  }
  if (typeof returning !== "string") {
    return "returning is not a string";
  }
  return "OK";
}

function isBoolean(arg: any) {
  return typeof arg === "boolean";
}

export function validateIRelayerMakerOrder(order: IRelayerMakerOrder) {
  const {
    marketHash,
    maker,
    totalBetSize,
    percentageOdds,
    expiry,
    executor,
    baseToken,
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
  const bigNumPercentageOdds = BigNumber.from(percentageOdds);
  if (bigNumPercentageOdds.gte(FRACTION_DENOMINATOR)) {
    return `percentageOdds must be less than ${FRACTION_DENOMINATOR.toString()}`;
  }
  if (!(parseInt(expiry, 10) >= Date.now() / 1000)) {
    return "expiry before current time.";
  }
  if (!isAddress(executor)) {
    return "executor is not a valid address";
  }
  if (!isAddress(baseToken)) {
    return "baseToken is not a valid address";
  }
  if (!isPositiveBigNumber(salt)) {
    return "salt as a number is not positive";
  }
  if (!isBoolean(isMakerBettingOutcomeOne)) {
    return "isMakingBettingOutcomeOne undefined or malformed.";
  }
  return "OK";
}

export function validateISignedRelayerMakerOrder(
  order: ISignedRelayerMakerOrder
) {
  const baseValidation = validateIRelayerMakerOrder(order);
  if (baseValidation !== "OK") {
    return baseValidation;
  }
  const { signature } = order;
  if (!isHexString(signature)) {
    return "signature is not a valid hex string.";
  }
  return "OK";
}

export function validateINewOrderSchema(order: INewOrder) {
  if (typeof order.expiry !== "number" || order.expiry < 0) {
    return "Expiry undefined or malformed.";
  }
  if (order.expiry < Date.now() / 1000) {
    return "Expiry before current time.";
  }
  if (!isPositiveBigNumber(order.totalBetSize)) {
    return "totalBetSize undefined or malformed.";
  }
  if (
    !isPositiveBigNumber(order.percentageOdds) ||
    BigNumber.from(order.percentageOdds).gte(convertToAPIPercentageOdds(1))
  ) {
    return "impliedOdds must be between 0 and 1 exclusive.";
  }
  if (!isHexString(order.marketHash)) {
    return "marketHash undefined or malformed.";
  }
  if (typeof order.isMakerBettingOutcomeOne !== "boolean") {
    return "isMakerBettingOutcomeOne undefined or malformed.";
  }
  if (!isAddress(order.baseToken)) {
    return "baseToken undefined or malformed.";
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
    const bigNumber = BigNumber.from(object);
    return bigNumber.gt(constants.Zero);
  } catch (e) {
    return false;
  }
}

export { isAddress }
