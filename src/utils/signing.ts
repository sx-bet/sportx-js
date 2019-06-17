import { Wallet } from "ethers";
import { arrayify, solidityKeccak256 } from "ethers/utils";
import { IContractOrder, IRelayerNewMakerOrder } from "../types/internal";
import { convertToContractOrder } from "./convert";

export async function getOrderSignature(
  order: IRelayerNewMakerOrder,
  wallet: Wallet
) {
  const contractOrder = convertToContractOrder(order);
  return getContractOrderSignature(contractOrder, wallet);
}

function getOrderHash(order: IContractOrder) {
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
