import { bigNumberify } from "ethers/utils";

const RINKEBY_RELAYER_URL = "https://rinkeby.api.sportx.bet";
const PRODUCTION_RELAYER_URL = "https://app.api.sportx.bet";
const RELAYER_TIMEOUT = 10000;

export const PERCENTAGE_PRECISION_EXPONENT = 20;
export const FRACTION_DENOMINATOR = bigNumberify(10).pow(
  PERCENTAGE_PRECISION_EXPONENT
);

enum Environments {
  RINKEBY,
  PRODUCTION
}

export enum Tokens {
  WETH = "WETH",
  DAI = "DAI"
}

export const TOKEN_TRANSFER_PROXY_ADDRESS = {
  [Environments.RINKEBY]: "0x6960fa4540c92b9fB08c4afBE04cD83f3CCf0378",
  [Environments.PRODUCTION]: "0x95B90DbA0516FD2aa991A2F4afa7817546ffB06d"
}

export const TOKEN_ADDRESSES = {
  [Tokens.DAI]: {
    [Environments.RINKEBY]: "0xd32f156f5A94eF3E5A72978D9B411D520a5F82AE",
    [Environments.PRODUCTION]: "0x6b175474e89094c44da98b954eedeac495271d0f"
  },
  [Tokens.WETH]: {
    [Environments.RINKEBY]: "0x72c01f172C8493dE1d3054549B5b1Fe42B5cf42B",
    [Environments.PRODUCTION]: "NOT_IMPLEMENTED"
  }
}

export const RELAYER_HTTP_ENDPOINTS = {
  SPORTS: "/sports",
  LEAGUES: "/leagues",
  ACTIVE_ORDERS: "/active-orders",
  ORDERS: "/orders",
  PENDING_BETS: "/pending-bets",
  METADATA: "/metadata",
  ACTIVE_MARKETS: "/markets/active",
  NEW_ORDER: "/orders/new",
  SUGGEST_ORDERS: "/orders/suggest",
  FILL_ORDERS: "/orders/fill",
  CANCEL_ORDERS: "/orders/cancel",
  TRADES: "/trades",
  DAI_APPROVAL: "/user/dai-approval"
};

export const CHANNEL_BASE_KEYS = {
  ACTIVE_ORDERS: "active_orders",
  GAME_ORDER_BOOK: "game_order_book",
  SUMMARY_LEAGUE: "summary_league",
  SUMMARY_GAME: "summary_game",
  PENDING_BETS: "pending_bets"
};

export {
  RINKEBY_RELAYER_URL,
  PRODUCTION_RELAYER_URL,
  Environments,
  RELAYER_TIMEOUT
};
