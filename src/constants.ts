import { BigNumber } from "@ethersproject/bignumber";

export const RELAYER_TIMEOUT = 10000;

export const PERCENTAGE_PRECISION_EXPONENT = 20;
export const FRACTION_DENOMINATOR = BigNumber.from(10).pow(
  PERCENTAGE_PRECISION_EXPONENT
);

export enum Networks {
  SX_TORONTO = "sx-toronto",
  SX_MAINNET = "sx-mainnet",
}

export enum Environments {
  SxToronto = "toronto",
  SxStage = "stage",
  SxMainnet = "production",
}

export enum Tokens {
  DAI = "DAI",
  WETH = "WETH",
  SPORTX = "SX",
  USDC = "USDC",
}

export const RELAYER_URLS = {
  [Environments.SxToronto]: "https://api.toronto.sx.bet",
  [Environments.SxStage]: "https://api.stage.sx.bet",
  [Environments.SxMainnet]: "https://api.sx.bet",
};

export const DEFAULT_RPC_URLS = {
  [Environments.SxToronto]: "https://rpc.toronto.sx.technology",
  [Environments.SxStage]: "https://rpc.sx.technology",
  [Environments.SxMainnet]: "https://rpc.sx.technology"
};

export const TOKEN_TRANSFER_PROXY_ADDRESS = {
  [Environments.SxToronto]: "0x6681293989e06a4E7c7e18c13C1AE13925BdfdB7",
  [Environments.SxStage]: "0xA82Aec37d413dBF27bc4A6b830C14C145ffF9279",
  [Environments.SxMainnet]: "0xCc4fBba7D0E0F2A03113F42f5D3aE80d9B2aD55d",
};


export const EIP712_VERSION = {
  [Environments.SxMainnet]: "4.0",
  [Environments.SxToronto]: "4.0",
  [Environments.SxStage]: "4.0",
};

interface IStringObj {
  [env: string]: string;
}

interface INestedStringObj {
  [env: string]: IStringObj;
}

export const CHAIN_IDS = {
  [Networks.SX_TORONTO]: 647,
  [Networks.SX_MAINNET]: 416,
};

export const TOKEN_ADDRESSES: INestedStringObj = {
  [Networks.SX_TORONTO]: {
    [Tokens.WETH]: "0x93964E8d07585672b4d38E5F88E674fF2C418B02",
    [Tokens.USDC]: "0x5147891461a7C81075950f8eE6384e019e39ab98",
    [Tokens.SPORTX]: "0x2D4e10Ee64CCF407C7F765B363348f7F62D2E06e",
  },
  [Networks.SX_MAINNET]: {
    [Tokens.WETH]: "0xA173954Cc4b1810C0dBdb007522ADbC182DaB380",
    [Tokens.USDC]: "0xe2aa35C2039Bd0Ff196A6Ef99523CC0D3972ae3e",
    [Tokens.SPORTX]: "0xaa99bE3356a11eE92c3f099BD7a038399633566f",
  },
};

export const FILL_ORDER_ADDRESS = {
  [Environments.SxToronto]: "0x5eC99Afcc00876AF7bd75eC2BC82D9Db220ca7F8",
  [Environments.SxStage]: "0xDE9C81f453a31832925E5E9D0a2C86E5786eaaca",
  [Environments.SxMainnet]: "0xF3440625e1751208350384d11C5AC89ed2b6eEb2",
};
export const EIP712_FILL_HASHER_ADDRESSES = {
  [Environments.SxToronto]: "0xd29EA8FB542BcA706c374b008f87344062a530e9",
  [Environments.SxStage]: "0xb2d7C177FFF04E2BE8CeFFa67955dEF19eac70e8",
  [Environments.SxMainnet]: "0x3E96B0a25d51e3Cc89C557f152797c33B839968f"
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
  FILL_ORDERS: "/orders/fill",
  CANCEL_ORDERS: "/orders/cancel/v2",
  CANCEL_EVENT_ORDERS: "/orders/cancel/event",
  CANCEL_ALL_ORDERS: "/orders/cancel/all",
  TRADES: "/trades",
  DAI_APPROVAL: "/user/approve-proxy",
  USER_TOKEN: "/user/token",
  LIVE_SCORES: "/live-scores",
};

export const TokenDecimalMapping: { [address: string]: number } = {
  [TOKEN_ADDRESSES[Networks.SX_TORONTO][Tokens.WETH]]: 18,
  [TOKEN_ADDRESSES[Networks.SX_TORONTO][Tokens.SPORTX]]: 18,
  [TOKEN_ADDRESSES[Networks.SX_TORONTO][Tokens.USDC]]: 6,
  [TOKEN_ADDRESSES[Networks.SX_MAINNET][Tokens.WETH]]: 18,
  [TOKEN_ADDRESSES[Networks.SX_MAINNET][Tokens.SPORTX]]: 18,
  [TOKEN_ADDRESSES[Networks.SX_MAINNET][Tokens.USDC]]: 6
};
