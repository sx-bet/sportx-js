import { bigNumberify } from "ethers/utils";

const RELAYER_TIMEOUT = 10000;

export const PERCENTAGE_PRECISION_EXPONENT = 20;
export const FRACTION_DENOMINATOR = bigNumberify(10).pow(
  PERCENTAGE_PRECISION_EXPONENT
);

enum Environments {
  RINKEBY,
  PRODUCTION,
  MUMBAI
}

export enum Tokens {
  WETH = "WETH",
  DAI = "DAI"
}

export const RELAYER_URLS = {
  [Environments.MUMBAI]: "https://mumbai.api.sportx.bet",
  [Environments.PRODUCTION]: "https://app.api.sportx.bet",
  [Environments.RINKEBY]: "https://rinkeby.api.sportx.bet"
}

export const TOKEN_TRANSFER_PROXY_ADDRESS = {
  [Environments.RINKEBY]: "0x04CEB6182EDC5dEdedfa84EA6F112f01f1195830",
  [Environments.PRODUCTION]: "0x60E8AA8a997da2c58Bc9894aAa08a28524e63bb5",
  [Environments.MUMBAI]: "0x65418f6cC32f7959783d1dDFdaFa827DcC023a87"
}

export const TOKEN_ADDRESSES = {
  [Tokens.DAI]: {
    [Environments.RINKEBY]: "0x44495672C86eEeE14adA9a3e453EEd68a338cdC1",
    [Environments.PRODUCTION]: "0x6b175474e89094c44da98b954eedeac495271d0f",
    [Environments.MUMBAI]: "0x6E2714F39EcbB0B05ca79ba1635c2347B14D91E6"
  },
  [Tokens.WETH]: {
    [Environments.RINKEBY]: "0xe40E1E31D2C313539e5D11cab684Ab98458BF4B3",
    [Environments.PRODUCTION]: "0x9d7c2A11322416436F0827E7bBDb3aE40BA693f9",
    [Environments.MUMBAI]: "0x714550C2C1Ea08688607D86ed8EeF4f5E4F22323"
  }
}

export const FILL_ORDER_ADDRESS = {
  [Environments.RINKEBY]: "0x1a4B302FFcA2e85104b5Dc20e5A46B69ab3655B7",
  [Environments.PRODUCTION]: "0x868845f1dC7CCc15BCe50d7c90E1E644971cfe10",
  [Environments.MUMBAI]: "0x360073ac80321b3f58eD899BF85d5B776bF93612"
}

export const EIP712_FILL_HASHER_ADDRESSES = {
  [Environments.RINKEBY]: "0x527f5aE68df7cE999381abffe1e28537692cBc96",
  [Environments.PRODUCTION]: "0x90C997f83885B4Bd16D3ef8ADD73B9d901d49095",
  [Environments.MUMBAI]: "0xF209cF19F688026290be59FC72c6729B83793cDc"
}

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
  DAI_APPROVAL: "/bridge/dai-permit"
};

export const CHANNEL_BASE_KEYS = {
  ACTIVE_ORDERS: "active_orders",
  GAME_ORDER_BOOK: "game_order_book",
  SUMMARY_LEAGUE: "summary_league",
  SUMMARY_GAME: "summary_game",
  PENDING_BETS: "pending_bets"
};

export {
  Environments,
  RELAYER_TIMEOUT
};
