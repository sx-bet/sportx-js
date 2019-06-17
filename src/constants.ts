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

export const WEBSOCKET_MESSAGE_KEYS = {
  NEW_ORDER: "new_order",
  ACTIVE_MARKETS: "active_markets",
  SUMMARY: "summary",
  METADATA: "metadata",
  SUBSCRIBE_GAME: "subscribe_game",
  UNSUBSCRIBE_GAME: "unsubscribe_game",
  CANCEL_ORDER: "cancel_order",
  SUBSCRIBE_ACCOUNT: "subscribe_account",
  UNSUBSCRIBE_ACCOUNT: "unsubscribe_account",
  MARKET_ORDER: "market_order",
  META_FILL_ORDER: "meta_fill_order",
  ACTIVE_ORDERS: "active_orders",
  ORDER_BOOK: "order_book",
  PENDING_UNSETTLED_BETS: "pending_unsettled_bets"
};

export const RELAYER_HTTP_ENDPOINTS = {
  SPORTS: "/sports",
  LEAGUES: "/leagues",
  ACTIVE_ORDERS: "/active-orders",
  ORDERS: "/orders",
  PENDING_BETS: "/pending-bets"
};

export {
  RINKEBY_RELAYER_URL,
  PRODUCTION_RELAYER_URL,
  Environments,
  RELAYER_TIMEOUT
};
