import { Environments, PublicNetworks, SidechainNetworks } from "../constants";

export function getMainchainNetwork(environment: Environments) {
  switch (environment) {
    case Environments.MUMBAI:
      return PublicNetworks.GOERLI;
    case Environments.PRODUCTION:
      return PublicNetworks.MAIN;
    default:
      throw new Error(`Unknown environment ${environment}`);
  }
}

export function getSidechainNetwork(environment: Environments) {
  switch (environment) {
    case Environments.MUMBAI:
      return SidechainNetworks.MUMBAI_MATIC;
    case Environments.PRODUCTION:
      return SidechainNetworks.MAIN_MATIC;
    case Environments.SXN:
      return SidechainNetworks.SXN;
    default:
      throw new Error(`Unkown environment ${environment}`);
  }
}
