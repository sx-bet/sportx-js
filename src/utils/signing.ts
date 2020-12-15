import { Signer, utils } from "ethers";
import { arrayify, hexlify } from "ethers/utils";
import {
  ICancelDetails,
  IContractOrder,
  IFillDetails
} from "../types/internal";
import { IRelayerMakerOrder } from "../types/relayer";
import { convertToContractOrder } from "./convert";

export async function getOrderSignature(
  order: IRelayerMakerOrder,
  wallet: Signer
) {
  const contractOrder = convertToContractOrder(order);
  return getContractOrderSignature(contractOrder, wallet);
}

export function getOrderHash(order: IContractOrder): string {
  return utils.solidityKeccak256(
    [
      "bytes32",
      "address",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "address",
      "address",
      "bool"
    ],
    [
      order.marketHash,
      order.baseToken,
      order.totalBetSize,
      order.percentageOdds,
      order.expiry,
      order.salt,
      order.maker,
      order.executor,
      order.isMakerBettingOutcomeOne
    ]
  );
}

async function getContractOrderSignature(
  order: IContractOrder,
  signer: Signer
) {
  const hash = arrayify(getOrderHash(order));
  return signer.signMessage(hash);
}

export function getFillOrderEIP712Payload(
  fillDetails: IFillDetails,
  chainId: number,
  verifyingContract: string
) {
  const payload = {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" }
      ],
      Details: [
        { name: "action", type: "string" },
        { name: "market", type: "string" },
        { name: "betting", type: "string" },
        { name: "stake", type: "string" },
        { name: "odds", type: "string" },
        { name: "returning", type: "string" },
        { name: "fills", type: "FillObject" }
      ],
      FillObject: [
        { name: "orders", type: "Order[]" },
        { name: "makerSigs", type: "bytes[]" },
        { name: "takerAmounts", type: "uint256[]" },
        { name: "fillSalt", type: "uint256" }
      ],
      Order: [
        { name: "marketHash", type: "bytes32" },
        { name: "baseToken", type: "address" },
        { name: "totalBetSize", type: "uint256" },
        { name: "percentageOdds", type: "uint256" },
        { name: "expiry", type: "uint256" },
        { name: "salt", type: "uint256" },
        { name: "maker", type: "address" },
        { name: "executor", type: "address" },
        { name: "isMakerBettingOutcomeOne", type: "bool" }
      ]
    },
    primaryType: "Details",
    domain: {
      name: "SportX",
      version: "1.0",
      chainId,
      verifyingContract
    },
    message: {
      action: fillDetails.action,
      market: fillDetails.market,
      betting: fillDetails.betting,
      stake: fillDetails.stake,
      odds: fillDetails.odds,
      returning: fillDetails.returning,
      fills: {
        makerSigs: fillDetails.fills.makerSigs,
        orders: fillDetails.fills.orders.map(order => ({
          marketHash: order.marketHash,
          baseToken: order.baseToken,
          totalBetSize: order.totalBetSize.toString(),
          percentageOdds: order.percentageOdds.toString(),
          expiry: order.expiry.toString(),
          salt: order.salt.toString(),
          maker: order.maker,
          executor: order.executor,
          isMakerBettingOutcomeOne: order.isMakerBettingOutcomeOne
        })),
        takerAmounts: fillDetails.fills.takerAmounts.map(takerAmount =>
          takerAmount.toString()
        ),
        fillSalt: fillDetails.fills.fillSalt.toString()
      }
    }
  };
  return payload;
}

export function getMaticEip712Payload(
  abiEncodedFunctionSig: string,
  nonce: number,
  from: string,
  chainId: number,
  verifyingContract: string,
  domainName: string
) {
  return {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "verifyingContract", type: "address" },
        { name: "salt", type: "bytes32" }
      ],
      MetaTransaction: [
        { name: "nonce", type: "uint256" },
        { name: "from", type: "address" },
        { name: "functionSignature", type: "bytes" }
      ]
    },
    domain: {
      name: domainName,
      version: "1",
      salt: utils.hexZeroPad(hexlify(chainId), 32),
      verifyingContract
    },
    message: {
      nonce,
      from,
      functionSignature: abiEncodedFunctionSig
    },
    primaryType: "MetaTransaction"
  };
}

export function getCancelOrderEIP712Payload(
  cancelDetails: ICancelDetails,
  chainId: number
) {
  const payload = {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" }
      ],
      Details: [
        { name: "message", type: "string" },
        { name: "orders", type: "string[]" }
      ]
    },
    primaryType: "Details",
    domain: {
      name: "CancelOrderSportX",
      version: "1.0",
      chainId
    },
    message: cancelDetails
  };
  return payload;
}
