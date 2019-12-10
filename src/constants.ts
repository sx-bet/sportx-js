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
  CANCEL_ORDERS: "/orders/cancel"
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
