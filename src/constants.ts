import { BigNumber } from "@ethersproject/bignumber";

export const RELAYER_TIMEOUT = 10000;

export const PERCENTAGE_PRECISION_EXPONENT = 20;
export const FRACTION_DENOMINATOR = BigNumber.from(10).pow(
  PERCENTAGE_PRECISION_EXPONENT
);

export enum PublicNetworks {
  GOERLI = "goerli",
  MAIN = "main"
}

export enum SidechainNetworks {
  MUMBAI_MATIC = "mumbai_matic",
  MAIN_MATIC = "main_matic"
}

export enum Environments {
  MUMBAI = "mumbai",
  PRODUCTION = "production"
}

export enum Tokens {
  DAI = "DAI",
  WETH = "WETH",
  SPORTX = "SX",
  USDC = "USDC"
}

export const RELAYER_URLS = {
  [Environments.MUMBAI]: "http://localhost:8080",
  [Environments.PRODUCTION]: "https://app.api.sportx.bet"
};

export const DEFAULT_MATIC_RPL_URLS = {
  [Environments.MUMBAI]: "https://rpc-mumbai.matic.today",
  [Environments.PRODUCTION]: "https://rpc-mainnet.matic.network"
};

export const TOKEN_TRANSFER_PROXY_ADDRESS = {
  [Environments.MUMBAI]: "0xE667fa04A0F6Ff910Ff8b6889fC49b80585864D3",
  [Environments.PRODUCTION]: "0xa6EA1Ed4aeC85dF277fae3512f8a6cbb40c1Fe7e"
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
    [Tokens.SPORTX]: "0xDEA6BC85D436Ce75026916dffa9dc14325C87B5F",
    [Tokens.USDC]: "0xa25dA0331Cd053FD17C47c8c34BCCBAaF516C438"
  },
  [PublicNetworks.GOERLI]: {
    [Tokens.DAI]: "0xEc94ecC0662A62C7D805f278AF73E3BE37Bb717e",
    [Tokens.SPORTX]: "0x79ECd185478882c1075f9972587D6c1d59d1A44f",
    [Tokens.USDC]: "0xf278Af28D82c58Da6d97d70DA64786092734A947"
  },
  [SidechainNetworks.MAIN_MATIC]: {
    [Tokens.DAI]: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    [Tokens.WETH]: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    [Tokens.SPORTX]: "0x840195888Db4D6A99ED9F73FcD3B225Bb3cB1A79",
    [Tokens.USDC]: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
  },
  [PublicNetworks.MAIN]: {
    [Tokens.DAI]: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    [Tokens.SPORTX]: "0x99fE3B1391503A1bC1788051347A1324bff41452",
    [Tokens.USDC]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  }
};

export const FILL_ORDER_ADDRESS = {
  [Environments.MUMBAI]: "0x360073ac80321b3f58eD899BF85d5B776bF93612",
  [Environments.PRODUCTION]: "0x398995122D4C5215991c15C2c5EfB96882695d1A"
};

export const EIP712_FILL_HASHER_ADDRESSES = {
  [Environments.MUMBAI]: "0xe702c1dAF71948b59892b30613187b050249339a",
  [Environments.PRODUCTION]: "0xCc4fBba7D0E0F2A03113F42f5D3aE80d9B2aD55d"
};

export const RELAYER_HTTP_ENDPOINTS = {
  SPORTS: "/sports",
  LEAGUES: "/leagues",
  ACTIVE_LEAGUES: "/leagues/active",
  ACTIVE_ORDERS: "/active-orders",
  ORDERS: "/orders",
  PENDING_BETS: "/pending-bets",
  METADATA: "/metadata",
  ACTIVE_MARKETS: "/markets/active",
  POPULAR: "/markets/popular",
  HISTORICAL_MARKETS: "/markets/find",
  NEW_ORDER: "/orders/new",
  SUGGEST_ORDERS: "/orders/suggest",
  FILL_ORDERS: "/orders/fill",
  CANCEL_ORDERS: "/orders/cancel",
  TRADES: "/trades",
  DAI_APPROVAL: "/user/approve-proxy",
  USER_TOKEN: "/user/token",
  LIVE_SCORES: "/live-scores"
};

export const TokenDecimalMapping: { [address: string]: number } = {
  [TOKEN_ADDRESSES[SidechainNetworks.MUMBAI_MATIC][Tokens.DAI]]: 18,
  [TOKEN_ADDRESSES[SidechainNetworks.MUMBAI_MATIC][Tokens.WETH]]: 18,
  [TOKEN_ADDRESSES[SidechainNetworks.MUMBAI_MATIC][Tokens.SPORTX]]: 18,
  [TOKEN_ADDRESSES[SidechainNetworks.MUMBAI_MATIC][Tokens.USDC]]: 6,
  [TOKEN_ADDRESSES[PublicNetworks.GOERLI][Tokens.DAI]]: 18,
  [TOKEN_ADDRESSES[PublicNetworks.GOERLI][Tokens.SPORTX]]: 18,
  [TOKEN_ADDRESSES[PublicNetworks.GOERLI][Tokens.USDC]]: 6,
  [TOKEN_ADDRESSES[SidechainNetworks.MAIN_MATIC][Tokens.DAI]]: 18,
  [TOKEN_ADDRESSES[SidechainNetworks.MAIN_MATIC][Tokens.WETH]]: 18,
  [TOKEN_ADDRESSES[SidechainNetworks.MAIN_MATIC][Tokens.SPORTX]]: 18,
  [TOKEN_ADDRESSES[SidechainNetworks.MAIN_MATIC][Tokens.USDC]]: 6,
  [TOKEN_ADDRESSES[PublicNetworks.MAIN][Tokens.DAI]]: 18,
  [TOKEN_ADDRESSES[PublicNetworks.MAIN][Tokens.SPORTX]]: 18,
  [TOKEN_ADDRESSES[PublicNetworks.MAIN][Tokens.USDC]]: 6
};
