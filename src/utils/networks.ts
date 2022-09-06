import { Environments, Networks } from "../constants";

export function getNetwork(environment: Environments) {
  switch (environment) {
    case Environments.SxToronto:
      return Networks.SX_TORONTO;
    case Environments.SxStage:
      return Networks.SX_MAINNET;
    case Environments.SxMainnet:
      return Networks.SX_MAINNET;
    default:
      throw new Error(`Unkown environment ${environment}`);
  }
}
