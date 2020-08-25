import { bigNumberify } from "ethers/utils";

const RELAYER_TIMEOUT = 10000;

export const PERCENTAGE_PRECISION_EXPONENT = 20;
export const FRACTION_DENOMINATOR = bigNumberify(10).pow(
  PERCENTAGE_PRECISION_EXPONENT
);

export enum MainchainNetworks {
  GOERLI = "goerli",
  MAIN = "main",
}

export enum SidechainNetworks {
  MUMBAI_MATIC = "mumbai_matic",
  MAIN_MATIC = "main_matic",
}

enum Environments {
  MUMBAI,
}

export enum Tokens {
  WETH = "WETH",
  DAI = "DAI",
}

export const RELAYER_URLS = {
  [Environments.MUMBAI]: "https://mumbai.api.sportx.bet",
};

export const TOKEN_TRANSFER_PROXY_ADDRESS = {
  [Environments.MUMBAI]: "0x65418f6cC32f7959783d1dDFdaFa827DcC023a87",
};

interface IStringObj {
  [env: string]: string;
}

interface INestedStringObj {
  [env: string]: IStringObj;
}

export const TOKEN_ADDRESSES: INestedStringObj = {
  [SidechainNetworks.MUMBAI_MATIC]: {
    [Tokens.DAI]: "0x6E2714F39EcbB0B05ca79ba1635c2347B14D91E6",
    [Tokens.WETH]: "0x714550C2C1Ea08688607D86ed8EeF4f5E4F22323",
  },
  [MainchainNetworks.GOERLI]: {
    [Tokens.DAI]: "0xEc94ecC0662A62C7D805f278AF73E3BE37Bb717e",
  },
};

export const FILL_ORDER_ADDRESS = {
  [Environments.MUMBAI]: "0x360073ac80321b3f58eD899BF85d5B776bF93612",
};

export const EIP712_FILL_HASHER_ADDRESSES = {
  [Environments.MUMBAI]: "0xF209cF19F688026290be59FC72c6729B83793cDc",
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
  DAI_APPROVAL: "/bridge/dai-permit",
};

export const CHANNEL_BASE_KEYS = {
  ACTIVE_ORDERS: "active_orders",
  GAME_ORDER_BOOK: "game_order_book",
  SUMMARY_LEAGUE: "summary_league",
  SUMMARY_GAME: "summary_game",
  PENDING_BETS: "pending_bets",
};

export { Environments, RELAYER_TIMEOUT };
