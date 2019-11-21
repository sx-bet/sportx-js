# sportx-js

Be your own bookmaker and fill orders programmatically with the SportX API!

Questions? [Join our chat](https://discord.gg/xXUynCX)

## Install

`yarn add @sportx-bet/sportx-js`

or

`npm i @sportx-bet/sportx-js`

This library is compiled down to es6 and works in node and the browser.

## Usage

You can do the following things with this API:

1. Get all the active markets
2. Get all the sports supported by SportX
3. Get all the leagues supported by SportX
4. Submit a new order to a market
5. Cancel an existing order
6. Get all orders on market(s)
7. Get suggestions of orders to fill (gives you the orders with the best odds)
8. Fill order(s)
9. Get all active orders for an account
10. Get pending bets for a user
11. Subscribe to a game and get updates when any of the underlying markets (spread, money line, over under) change
12. Subscribe to an address and get updates when that addresses' bookmaker orders change

In any case, to get started, you can either initialize via your ethereum private key or initialize via an existing web3 instance. *Ensure that the backing provider for the web3 instance matches the network.*

### Initializing via ethereum private key

```typescript
import { Environments, newSportX } from "@sportx-bet/sportx-js";

async function main() {
  const sportX = await newSportX(
    Environments.RINKEBY,
    process.env.ETHEREUM_PRIVATE_KEY
  );
}
```

Note that you do not need a SportX API key to get started - this is just your Ethereum private key.

`newSportX` returns a promise that resolves to an initialized SportX API object.

### Initializing via an existing web3 instance.

```typescript
import { Environments, newSportX } from "@sportx-bet/sportx-js";
import { providers } from 'ethers';

async function main() {
  const sportX = await newSportX(
    Environments.RINKEBY,
    undefined,
    new providers.Web3Provider(web3.currentProvider)
  )
}
```

The following assume you have an initialized sportX API object.

### Get all the active markets

```typescript
const activeMarkets = await sportX.getActiveMarkets();
console.log(activeMarkets);
```

Which produces an **array** of objects with the following schema:

```typescript
interface IMarket {
  status: string;
  marketHash: string;
  baseToken: string;
  startDate: number;
  expiryDate: number;
  title: string;
  outcomeOneName: string;
  outcomeTwoName: string;
  outcomeVoidName: string;
  teamOneName: string;
  teamTwoName: string;
  sportId: number;
  leagueId: number;
  type: string;
  line?: number;
  reportedOnBlockchain: boolean;
  reportedDate?: number;
  outcome?: number;
  teamOneScore?: number;
  teamTwoScore?: number;
  teamOneMeta?: string;
  teamTwoMeta?: string;
  marketMeta?: string;
  sportLabel?: string;
  homeTeamFirst?: boolean;
  leagueLabel?: string;
}
```

The `sportId` and `leagueId`'s actual names can be found by fetching the leagues and sports. See below.

`line` will either be a spread or a total. You can figure out which team the spread is attributed to by looking at `outcomeOneName` and `outcomeTwoName`.

Example for a money line market:

```json
{
  "baseToken": "DAI",
  "expiryDate": 1560904200,
  "group1": "Copa America",
  "homeTeamFirst": true,
  "leagueId": 178,
  "leagueLabel": "Copa America",
  "marketHash": "0x75f5d0544a38bf41afab5cfd0a2b40b8df32bd76d91bfa5ece47ba739b179e",
  "outcomeOneName": "Brazil",
  "outcomeTwoName": "Venezuela",
  "outcomeVoidName": "NO_GAME",
  "sportId": 5,
  "sportLabel": "Soccer",
  "startDate": 1560571914,
  "teamOneName": "Brazil",
  "teamTwoName": "Venezuela",
  "title": "Soccer_Copa America,1560904200,Brazil,Venezuela,MONEY_LINE",
  "type": "MONEY_LINE"
}
```

Example for a spread market:

```json
{
  "baseToken": "DAI",
  "expiryDate": 1560904200,
  "group1": "Copa America",
  "homeTeamFirst": true,
  "leagueId": 178,
  "leagueLabel": "Copa America",
  "line": -2,
  "marketHash": "0x2e15327c0d79ea6129b5426160f789512aeabf9080f191613c517a2e404ba2b1",
  "outcomeOneName": "Brazil -2",
  "outcomeTwoName": "Venezuela +2",
  "outcomeVoidName": "NO_GAME_OR_EVEN",
  "sportId": 5,
  "sportLabel": "Soccer",
  "startDate": 1560571914,
  "teamOneName": "Brazil",
  "teamTwoName": "Venezuela",
  "title": "Soccer_Copa America,1560904200,Brazil,Venezuela,SPREAD,-2",
  "type": "SPREAD"
}
```

Example for an over/under/total market:

```json
{
  "baseToken": "DAI",
  "expiryDate": 1560904200,
  "group1": "Copa America",
  "homeTeamFirst": true,
  "leagueId": 178,
  "leagueLabel": "Copa America",
  "line": 3,
  "marketHash": "0xc987d6ab262e50b59bf00f0562415b2bf50cb8ebdab4785ac0774b901acb6e19",
  "outcomeOneName": "Over 3",
  "outcomeTwoName": "Under 3",
  "outcomeVoidName": "NO_GAME_OR_EVEN",
  "sportId": 5,
  "sportLabel": "Soccer",
  "startDate": 1560571914,
  "teamOneName": "Brazil",
  "teamTwoName": "Venezuela",
  "title": "Soccer_Copa America,1560904200,Brazil,Venezuela,OVER_UNDER,3",
  "type": "OVER_UNDER"
}
```

### Get all the sports supported by SportX

```typescript
const sports = await sportX.getSports();
console.log(sports);
```

Which produces an array of objects with the following schema:

```typescript
interface ISport {
  sportId: number;
  label: string;
}
```

Example output:

```json
[
  { "sportId": 1, "label": "Basketball" },
  { "sportId": 2, "label": "Hockey" },
  { "sportId": 3, "label": "Baseball" },
  { "sportId": 4, "label": "Golf" },
  { "sportId": 5, "label": "Soccer" },
  { "sportId": 6, "label": "Tennis" },
  { "sportId": 7, "label": "Mixed Martial Arts" },
  { "sportId": 8, "label": "Football" },
  { "sportId": 10, "label": "Custom" }
]
```

### Get all the leagues supported by SportX

```typescript
const leagues = await sportX.getLeagues();
console.log(leagues);
```

Which produces an array of objects with the following schema:

```typescript
interface ILeague {
  leagueId: number;
  label: string;
  sportId: number;
  referenceUrl: string;
  homeTeamFirst: boolean;
}
```

Example output:

```json
[
  {
    "leagueId": 10002,
    "label": "F1 Race",
    "sportId": 10,
    "referenceUrl": "sportx.bet",
    "homeTeamFirst": true
  },
  {
    "leagueId": 10000,
    "label": "League of Legends",
    "sportId": 9,
    "referenceUrl": "lol.com",
    "homeTeamFirst": true
  },
  {
    "leagueId": 1,
    "label": "NBA",
    "sportId": 1,
    "referenceUrl": "NBA.com",
    "homeTeamFirst": false
  },
  {
    "leagueId": 2,
    "label": "NCAA",
    "sportId": 1,
    "referenceUrl": "NCAA.com",
    "homeTeamFirst": false
  },
  {
    "leagueId": 3,
    "label": "NHL",
    "sportId": 2,
    "referenceUrl": "NHL.com",
    "homeTeamFirst": false
  },
  {
    "leagueId": 4,
    "label": "The Masters_Tournament",
    "sportId": 4,
    "referenceUrl": "masters.com",
    "homeTeamFirst": true
  },
  {
    "leagueId": 5,
    "label": "The Masters_Round 1",
    "sportId": 4,
    "referenceUrl": "masters.com",
    "homeTeamFirst": true
  },
  {
    "leagueId": 6,
    "label": "The Masters_Round 2",
    "sportId": 4,
    "referenceUrl": "masters.com",
    "homeTeamFirst": true
  },
  {
    "leagueId": 7,
    "label": "The Masters_Round 3",
    "sportId": 4,
    "referenceUrl": "masters.com",
    "homeTeamFirst": true
  }
]
```

### Submit a new order to a market

The odds in the API are all in a special implied format. For example, 2.0 (decimal) = 0.5 (implied). You'll need to convert your odds into implied in order to submit a new order to SportX. The odds you submit to place a new order on SportX are the odds you will receive as a bookmaker. Best explained with an example:

The payload you need to submit looks like this:

```typescript
interface INewOrder {
  marketHash: string;
  totalBetSize: string;
  percentageOdds: string;
  expiry: number;
  isMakerBettingOutcomeOne: boolean;
}
```

`marketHash` is the hash of the market to place the order. You can get a list of active markets using `sportX.getActiveMarkets()` as above.

`totalBetSize` is the **maximum** amount you wish to bet on the market. Note that this is an _order_ so it might not be filled, partially filled, or fully filled.

`percentageOdds` is the implied odds you as a maker will receive in a special format. **Note that these are not the odds you are offering**! To convert between a maker (you) and taker odds, the formula is `takerImpliedOdds = 1 - makerImpliedOdds`

`expiry` is the expiry date of the order as a Unix timestamp. After this date, this order will be automatically removed and invalidated.

`isMakerBettingOutcomeOne` is `true` or `false` depending on if you as the maker wish to bet on outcome one or outcome two. You can see what the outcomes are in the `IMarket` schema above.

Some of these fields might have to be converted to a special format before submitting, but utilities are supplied for that.

Example:

```typescript
import { parseUnits } from "ethers/utils";
import moment from "moment";
import {
  convertToAPIPercentageOdds,
  convertToTrueTokenAmount
} from "@sportx-bet/sportx-js";

const activeMarkets = await sportX.getActiveMarkets();
const firstMarketHash = activeMarkets[0].marketHash;
const newOrder = {
  marketHash: firstMarketHash,
  totalBetSize: convertToTrueTokenAmount(10).toString(),
  percentageOdds: convertToAPIPercentageOdds(0.5).toString(),
  expiry: moment()
    .add(1, "hour")
    .unix(),
  isMakerBettingOutcomeOne: true
};
const response = await sportX.newOrder(newOrder);
console.log(response);
```

Here the `totalBetSize` is 10, converted into Ethereum format using the `convertToTrueTokenAmount()` utility. The implied odds that the maker is receiving is `0.5`, converted into the Ethereum format using the `convertToProtocolPercentage()` utility.

If successful, the response will look like

```json
{
  "status": "success",
  "data": {
    "orderHash": "0x066b9ce3e0b2e671695015db9cd772224120e03663e93d35ee447b86b2b49ef4"
  }
}
```

If it failed, it will throw an `APISchemaError` or `APIError` depending on the type of error (former would be validation and latter would be an error from the API).

### Cancel an existing order

To cancel an order you've submitted via above, you simply need the `orderHash`es of the order you wish to cancel. To get this, you can use the `getActiveOrders(address)` to get a list of all your active orders (see below).

The cancellations are instant.

Example:

```typescript
const response = await sportX.cancelOrder([
  "0x066b9ce3e0b2e671695015db9cd772224120e03663e93d35ee447b86b2b49ef4"
]);
console.log(response);
```

If successful, the response will look like

```json
{
  "status": "success",
  "data": {
    "orderHashes": [
      "0x066b9ce3e0b2e671695015db9cd772224120e03663e93d35ee447b86b2b49ef4"
    ]
  }
}
```

If it failed, it will throw an `APISchemaError` or `APIError` depending on the type of error (former would be validation and latter would be an error from the API).

### Get all orders on market(s)

To get all the orders for market(s), simply call `getOrders([marketHashes])`

Example:

```typescript
const orders = await sportX.getOrders([
  "0x75f5d0544a38bf41afab5cfd0a2b40b8df32bd76d91bfa5ece47ba739b179e4d"
]);
console.log(orders);
```

Which produces:

```json
[
  {
    "fillAmount": "0",
    "orderHash": "0x4091e13e0e8f104f70bc5f147adebb5961adf85f869806f868cab37520e7cda6",
    "marketHash": "0x75f5d0544a38bf41afab5cfd0a2b40b8df32bd76d91bfa5ece47ba739b179e4d'",
    "maker": "0xaD90d89b23Fc80bCF70c3E8CC23a21ccADFBC95F",
    "totalBetSize": "150000000000000000000",
    "percentageOdds": "91485727650227679586",
    "expiry": 1560904200,
    "relayerMakerFee": "0",
    "relayerTakerFee": "0",
    "relayer": "0xEBF9c090bb9E9cea54c1f5eC23c238aB42922289",
    "salt": "84548885320416437228828145919856326657411590956960346919167755421671785285427",
    "executor": "0xEBF9c090bb9E9cea54c1f5eC23c238aB42922289",
    "isMakerBettingOutcomeOne": true,
    "signature": "0x59c3c9c6da0ae1cc77072e43856cf8f4a6aa3f9caf737a33a279787ff34ecd94064bc3fc2a438bb317eb2a455d9b84b2e155a2c7eaf7f73a0b58fad9cd41a0da1b"
  },
  {
    "fillAmount": "0",
    "orderHash": "0x4b44c1c7f7f32ea42813c624e2bdef570333da214e617a1827445d78a594f259",
    "marketHash": "0x75f5d0544a38bf41afab5cfd0a2b40b8df32bd76d91bfa5ece47ba739b179e4d",
    "maker": "0xaD90d89b23Fc80bCF70c3E8CC23a21ccADFBC95F",
    "totalBetSize": "75000000000000000000",
    "percentageOdds": "896417220308870961",
    "expiry": 1560904200,
    "relayerMakerFee": "0",
    "relayerTakerFee": "0",
    "relayer": "0xEBF9c090bb9E9cea54c1f5eC23c238aB42922289",
    "salt": "62965102436418569939919982284939290277379355861365515708707721407487470531319",
    "executor": "0xEBF9c090bb9E9cea54c1f5eC23c238aB42922289",
    "isMakerBettingOutcomeOne": false,
    "signature": "0x726950b8d0643143caaaf3907c70f4d6142611d1024b2372e8a8880f0244ea947e569fc9449ea24f945ecced8a825892affe506f9ea9605aec29c68135756e721c"
  }
]
```

Explanation of the fields:

`fillAmount` is how much this order is filled by in Ethereum units. To convert to a readable amount you can use:

```typescript
import { convertToDisplayAmount } from "@sportx-bet/sportx-js";
console.log(convertToDisplayAmount("150000000000000000000"));
```

which produces "150"

`orderHash` is the unique ID of the order

`marketHash` is the unique ID of the market

`maker` is the address who created this order

`totalBetSize` is the total size of the order

`percentageOdds` is the implied odds the maker is receiving for this order. To convert into a readable implied odds, you can use:

```typescript
import { convertFromAPIPercentageOdds } from "@sportx-bet/sportx-js";

const odds = "88985727650227679586";
const convertedOdds = convertFromAPIPercentageOdds(odds);
console.log(convertedOdds);
```

which outputs 0.8898572765022768 (note that some rounding will occur)

`expiry` is the time at which the order is no longer valid and cannot be filled.

`isMakerBettingOutcomeOne` says whether the maker is betting outcome one or not. See the data from `sportX.getActiveMarkets()` to see what the outcomes are for the market.

The below are for information purposes only and not needed to operate this API.

`relayerMakerFee` is an additional trading fee charged by SportX on the maker, currently set to zero

`relayerTakerFee` is an additional trading fee charged by SportX on the taker, currently set to zero

`relayer` is the recipient of the above two fees.

`salt` is a random number to differentiate between two otherwise identical orders

`executor` is the address actually submitting the transaction to fill the order on the blockchain

`signature` is the signature on the order payload by the maker to verify that the maker did indeed create this order.

### Get fill suggestions

The API has a utility method to suggest to the orders with the best odds based on how much you want to fill. You can call `suggestOrders(marketHash, betSize, takerDirectionOutcomeOne, taker)` to receive the suggestions.

Example:

```typescript
const suggestions = await sportX.suggestOrders(
  "0xb3f686d972a91adecfd0d0b53a66fbbeffd4965a11519df6dbdc12d6ebc4b94e",
  "0x75BC4c86e7e096732a9a562dcc79a14D95784590",
  true,
  "15000000000000000000"
);
```

Which produces:

```json
{
  "fillAmounts": ["13204264472968820177"],
  "orderHashes": [
    "0x4291f23f6d05788386b213a79271ff3ebfd72687952a38fde0f0564223fe13f2"
  ]
}
```

Typically, you would use these "suggestions" to actually fill an order. See the next section.

### Filling orders

To actually fill orders on SportX, you will need the actual orders themselves which you can obtain from `getOrders(marketHash)` as well as the amount(s) you want to fill each order.

The orders are filled meta style, meaning that the filler does not pay for gas and instead the user just signs an "intent to fill" hash. The API covers the gas fee.

The signature is

`fillOrders(orders: IRelayerMakerOrder[], betAmounts: string[])`

Alternatively, you can use the `suggestOrders(marketHash, betSize, takerDirectionOutcomeOne, taker)` method above to suggest to you the `orderHashes` with the best odds given your `betSize`.

_Note that you will still need to get the actual orders themselves from `getOrders(marketHash)`. You will need to find the orders in the `getOrders(marketHash)` response whose orderHashe(s) match up._

There are superfluous fields that `getOrders(marketHash)` returns such as `signature` and `fillAmount`. You can keep these and pass the whole object to `fillOrders`.

Example (filling one order):

```typescript
const orders = [
  {
    executor: "0xEBF9c090bb9E9cea54c1f5eC23c238aB42922289"
    expiry: 1571763300
    isMakerBettingOutcomeOne: false
    maker: "0xE5F5cC7496b2B39F0a76442Bc8De0E7FEedc7e55"
    marketHash: "0x6fb98d18da6658435f7bdc645e30aa103882f3f5a814b6e64bf6829d5bb7af11"
    percentageOdds: "56827118644067796610"
    relayer: "0xEBF9c090bb9E9cea54c1f5eC23c238aB42922289"
    relayerMakerFee: "0"
    relayerTakerFee: "0"
    salt: "109465971184042040832918255631084373861510812876584310918706085768814010131009"
    totalBetSize: "250000000000000000000"
  }
];
const fillAmounts = [
  "200000000000000000000"
];
const result = await sportX.fillOrders(orders, fillAmounts);
console.log(result)
```

Which produces, if successful:

```json
{
  "status": "success",
  "hash": "0x1783ab84c367309ed2038c818c864501757418c61f25b6da617f83f64adce45c"
}
```

This hash is a transaction hash for the actual ethereum transaction which you can track. Note that this might not be the final transaction! Depending on gas prices, the SportX relayer will retry to submit the bet until it is successful. However, at this point, the bet is confirmed.

### Get all active orders for an account

To get all the active (unfilled or partially filled) orders for an account, you can do the following:

```typescript
const activeOrders = await sportX.getOrders(
  undefined,
  "0xF59E93290383ED15F73Ee923EbbF29f79e37B6d8"
);
console.log(activeOrders);
```

Which produces orders grouped by market hash as keys:

```json
[
  {
    "fillAmount": "0",
    "orderHash": "0x8ddd34e73b288d4c038539ee813ea88607803a3e24ae443b3040f9e8793394fe",
    "marketHash": "0xbb0b062dc0d017e43578dc9303f48cd73602bd4f6a9585b91ee4a2a1e0afbc36",
    "maker": "0xaD90d89b23Fc80bCF70c3E8CC23a21ccADFBC95F",
    "totalBetSize": "75000000000000000000",
    "percentageOdds": "55152773438304856903",
    "expiry": 1560884400,
    "relayerMakerFee": "0",
    "relayerTakerFee": "0",
    "relayer": "0xEBF9c090bb9E9cea54c1f5eC23c238aB42922289",
    "salt": "35485978637141361876232738522929776286192680166268767752859378082539513060903",
    "executor": "0xEBF9c090bb9E9cea54c1f5eC23c238aB42922289",
    "isMakerBettingOutcomeOne": false,
    "signature": "0xf2f0210f328eb04878496a6f970cc400672db524fd5650bf9ca42ce1774060082a040dc6e85bde539602babcb1e97d295f6a6078436d40bef1d4ac7319081ad81c"
  },
  {
    "fillAmount": "0",
    "orderHash": "0x808c93f3b5ee8cb47599be8e23a0d811e0752abf189a6746adad6f3a06ee9fda",
    "marketHash": "0xbb0b062dc0d017e43578dc9303f48cd73602bd4f6a9585b91ee4a2a1e0afbc36",
    "maker": "0xaD90d89b23Fc80bCF70c3E8CC23a21ccADFBC95F",
    "totalBetSize": "500000000000000000000",
    "percentageOdds": "36058315409643831747",
    "expiry": 1560884400,
    "relayerMakerFee": "0",
    "relayerTakerFee": "0",
    "relayer": "0xEBF9c090bb9E9cea54c1f5eC23c238aB42922289",
    "salt": "78496959933119259419935033215094016205058812453361105019042873506621461421155",
    "executor": "0xEBF9c090bb9E9cea54c1f5eC23c238aB42922289",
    "isMakerBettingOutcomeOne": true,
    "signature": "0xf119ed45ac127538eae88d07c048f41d881c2699d13f18b02edf54c04783dc9c4f877dba0fc153d5394e6d2fb9bcbbce1aea265ac16c70489e648bad4568bb901c"
  }
]
```

### Get pending bets for a user

Bets are instantly confirmed but they might have not settled yet on the blockchain. You can query bets that have yet to be settled using `sportX.getRecentPendingBets(bettor)`. _Note that this only works if the `bettor` is the taker in the trade_

Example:

```typescript
const pendingBets = await sportX.getRecentPendingBets(
  "0xaD90d89b23Fc80bCF70c3E8CC23a21ccADFBC95F"
);
console.log(pendingBets);
```

Which produces the details of the bets like so:

```json
[
  {
    "fillAmounts": ["44726667169493745756"],
    "orderHashes": [
      "0xe0cacd1adbc174b325d670ccb9dda58482b8921bf263fe4567c306ad5e2d7e96"
    ],
    "taker": "0x9e347e2EdC736971f218cf9B0D38c80b96625C4C",
    "status": "PENDING",
    "betTime": 1573851254,
    "fillHash": "0xe0e0802da0681030e43e4bb26209381f3be60193dd7a6ee3e70758751e417e24",
    "nonce": 1099,
    "marketHashes": [
      "0x33d6c56678e8ce91182d961134ccc2d78dbb62142772cf762c6b7ed72535ab0d"
    ],
    "percentageOdds": ["47216553169198533263"],
    "isMakerBettingOutcomeOne": [false]
  }
]
```

### Subscribe to a game and get updates when any of the underlying markets (spread, money line, over under) change

You can subscribe to a game and get full order book updates when any of the underlying markets' order books change. Unfortunately we do not currently support subscribing to a single game - this is coming soon.

To get a game ID, you can use the utility method `getCompactGameId(market: IMarket)` with markets from `sportX.getActiveMarkets()` to get the game ID. Then you can call `sportX.subscribeGameOrderBook(compactGameId)`

Example:

```typescript
await sportX.subscribeGameOrderBook("1,2,1573844400,Howard,Robert Morris");
```

If it failed, it will throw an `APISchemaError` or `APIError` depending on the type of error (former would be validation and latter would be an error from the API).

You can now listen to the `game_order_book` event emitted by the sportX object:

```typescript
sportX.on("game_order_book", data => console.log(data));
```

`data` in above will be in the same format as the results in the "Get all orders on market(s)" section but grouped by `compactGameId`

You can subscribe to multiple games by just calling `sportX.subscribeGameOrderBook(gameId)` multiple times. _Note that if you subscribe to multiple games, you will have to search for the `marketHash` in the resulting order arrays to determine which market the updates are for._

To unsubscribe, you'll need to do the following:

```typescript
await sportX.unsubscribeGameOrderBook("1,2,1573844400,Howard,Robert Morris");
```

If it failed, it will throw an `APISchemaError` or `APIError` depending on the type of error (former would be validation and latter would be an error from the API).

Now you will no longer get `game_order_book` events containing the market hashes under that particular `compactGameId`. But you still might get updates for other games you have subscribed to.

### Subscribe to an address and get updates when that addresses' bookmaker orders change

You can subscribe to an account and get updates when that account's active orders change (filled, cancelled, etc).

Example:

```typescript
await sportX.subscribeActiveOrders(
  "0xF59E93290383ED15F73Ee923EbbF29f79e37B6d8"
);
```

If it failed, it will throw an `APISchemaError` or `APIError` depending on the type of error (former would be validation and latter would be an error from the API).

You can now listen to the `active_orders` event emitted by the sportX object:

```typescript
sportX.on("active_orders", data => console.log(data));
```

`data` in above will be in the same format as the results in the "Get all active orders for an account" section

You can subscribe to multiple accounts by just calling `sportX.subscribeActiveOrders(address)` multiple times. _Note that if you subscribe to multiple accounts, you will have to search for the `maker` in the resulting arrays to determine which accounts the update is for_

To unsubscribe, you'll need to do the following:

```typescript
await sportX.unsubscribeActiveOrders(
  "0xF59E93290383ED15F73Ee923EbbF29f79e37B6d8"
);
```

If it failed, it will throw an `APISchemaError` or `APIError` depending on the type of error (former would be validation and latter would be an error from the API).

## Debugging

We use https://www.npmjs.com/package/debug to provide debugging support for consumers of this package. Simply

`export DEBUG=sportx-js`

and you will see raw responses from the SportX relayer.
