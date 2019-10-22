import { Wallet } from "ethers";
import { arrayify, BigNumber, solidityKeccak256 } from "ethers/utils";
import { IContractOrder } from "../types/internal";
import { IRelayerMakerOrder } from "../types/relayer";
import { convertToContractOrder } from "./convert";

export async function getOrderSignature(
  order: IRelayerMakerOrder,
  wallet: Wallet
) {
  const contractOrder = convertToContractOrder(order);
  return getContractOrderSignature(contractOrder, wallet);
}

export function getOrderHash(order: IContractOrder) {
  return solidityKeccak256(
    [
      "bytes32",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "address",
      "address",
      "address",
      "bool"
    ],
    [
      order.marketHash,
      order.totalBetSize,
      order.percentageOdds,
      order.expiry,
      order.relayerMakerFee,
      order.relayerTakerFee,
      order.salt,
      order.maker,
      order.relayer,
      order.executor,
      order.isMakerBettingOutcomeOne
    ]
  );
}

async function getContractOrderSignature(
  order: IContractOrder,
  signer: Wallet
) {
  const hash = arrayify(getOrderHash(order));
  return signer.signMessage(hash);
}

export function getFillHash(
  order: IContractOrder,
  takerAmount: BigNumber,
  fillSalt: BigNumber,
  submitterFee?: BigNumber
): string {
  const baseSolTypesArray = [
    "bytes32",
    "uint256",
    "uint256",
    "uint256",
    "uint256",
    "uint256",
    "uint256",
    "address",
    "address",
    "address",
    "bool",
    "uint256",
    "uint256"
  ];
  const baseSolValsArray = [
    order.marketHash,
    order.totalBetSize,
    order.percentageOdds,
    order.expiry,
    order.relayerMakerFee,
    order.relayerTakerFee,
    order.salt,
    order.maker,
    order.relayer,
    order.executor,
    order.isMakerBettingOutcomeOne,
    takerAmount,
    fillSalt
  ];
  if (submitterFee) {
    baseSolTypesArray.push("uint256");
    baseSolValsArray.push(submitterFee);
  }
  return solidityKeccak256(baseSolTypesArray, baseSolValsArray);
}

export function getMultiFillHash(
  orders: IContractOrder[],
  takerAmounts: BigNumber[],
  fillSalt: BigNumber,
  submitterFee?: BigNumber
): string {
  if (orders.length !== takerAmounts.length) {
    throw new Error("Orders length is not the same as takerAmounts length");
  }
  let totalHash = getFillHash(
    orders[0],
    takerAmounts[0],
    fillSalt,
    submitterFee
  );
  if (orders.length === 1) {
    return totalHash;
  }
  for (let index = 1; index < orders.length; index++) {
    const order = orders[index];
    const takerAmount = takerAmounts[index];
    const fillHash = getFillHash(order, takerAmount, fillSalt, submitterFee);
    totalHash = solidityKeccak256(
      ["bytes32", "bytes32"],
      [arrayify(totalHash), arrayify(fillHash)]
    );
  }
  return totalHash;
}
