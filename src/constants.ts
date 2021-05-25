import { bigNumberify } from "ethers/utils";

export const RELAYER_TIMEOUT = 10000;

export const PERCENTAGE_PRECISION_EXPONENT = 20;
export const FRACTION_DENOMINATOR = bigNumberify(10).pow(
  PERCENTAGE_PRECISION_EXPONENT
);

export enum PublicNetworks {
  GOERLI = "goerli",
  MAIN = "main",
}

export enum SidechainNetworks {
  MUMBAI_MATIC = "mumbai_matic",
  MAIN_MATIC = "main_matic",
}

export enum Environments {
  MUMBAI = "mumbai",
  PRODUCTION = "production",
}

export enum Tokens {
  WETH = "WETH",
  DAI = "DAI",
}

export const RELAYER_URLS = {
  [Environments.MUMBAI]: "http://localhost:8080",
  [Environments.PRODUCTION]: "https://app.api.sportx.bet",
};

export const DEFAULT_MATIC_RPL_URLS = {
  [Environments.MUMBAI]: "https://rpc-mumbai.matic.today",
  [Environments.PRODUCTION]: "https://rpc-mainnet.matic.network",
};

export const TOKEN_TRANSFER_PROXY_ADDRESS = {
  [Environments.MUMBAI]: "0xE667fa04A0F6Ff910Ff8b6889fC49b80585864D3",
  [Environments.PRODUCTION]: "0xa6EA1Ed4aeC85dF277fae3512f8a6cbb40c1Fe7e",
};

interface IStringObj {
  [env: string]: string;
}

interface INestedStringObj {
  [env: string]: IStringObj;
}

export const TOKEN_ADDRESSES: INestedStringObj = {
  [SidechainNetworks.MUMBAI_MATIC]: {
    [Tokens.DAI]: "0x6A383cf1F8897585718DCA629a8f1471339abFe4",
    [Tokens.WETH]: "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa",
  },
  [PublicNetworks.GOERLI]: {
    [Tokens.DAI]: "0xEc94ecC0662A62C7D805f278AF73E3BE37Bb717e",
  },
  [SidechainNetworks.MAIN_MATIC]: {
    [Tokens.DAI]: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    [Tokens.WETH]: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
  },
  [PublicNetworks.MAIN]: {
    [Tokens.DAI]: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  },
};

export const FILL_ORDER_ADDRESS = {
  [Environments.MUMBAI]: "0x360073ac80321b3f58eD899BF85d5B776bF93612",
  [Environments.PRODUCTION]: "0x398995122D4C5215991c15C2c5EfB96882695d1A",
};

export const EIP712_FILL_HASHER_ADDRESSES = {
  [Environments.MUMBAI]: "0xe702c1dAF71948b59892b30613187b050249339a",
  [Environments.PRODUCTION]: "0xCc4fBba7D0E0F2A03113F42f5D3aE80d9B2aD55d",
};

export const RELAYER_HTTP_ENDPOINTS = {
  SPORTS: "/sports",
  LEAGUES: "/leagues",
  ACTIVE_ORDERS: "/active-orders",
  ORDERS: "/orders",
  PENDING_BETS: "/pending-bets",
  METADATA: "/metadata",
  ACTIVE_MARKETS: "/markets/active",
  HISTORICAL_MARKETS: "/markets/find",
  NEW_ORDER: "/orders/new",
  SUGGEST_ORDERS: "/orders/suggest",
  FILL_ORDERS: "/orders/fill",
  CANCEL_ORDERS: "/orders/cancel",
  TRADES: "/trades",
  DAI_APPROVAL: "/user/approve-proxy",
};
