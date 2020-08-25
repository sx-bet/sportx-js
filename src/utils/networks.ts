import {
  Environments,
  MainchainNetworks,
  SidechainNetworks
} from "../constants";

export function getMainchainNetwork(environment: Environments) {
  switch (environment) {
    case Environments.MUMBAI:
      return MainchainNetworks.GOERLI;
    default:
      throw new Error(`Unknown environment ${environment}`);
  }
}

export function getSidechainNetwork(environment: Environments) {
  switch (environment) {
    case Environments.MUMBAI:
      return SidechainNetworks.MUMBAI_MATIC;
    default:
      throw new Error(`Unkown environment ${environment}`);
  }
}
