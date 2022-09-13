# sportx-js

Be your own bookmaker and fill orders programmatically with the SX Bet API!

Questions? [Join our chat](https://discord.gg/xXUynCX)

## Install

`yarn add @sx-bet/sportx-js`

or

`npm i @sx-bet/sportx-js`

This library is compiled down to es6 and works in node and the browser.

## Usage

You can do the following things with this API:

1. Get all the active markets
2. Get all the sports supported by SportX
3. Get all the leagues supported by SportX
4. Submit a new order to a market
5. Cancel an existing order
6. Get all orders on market(s)
7. Fill order(s)
8. Get all active orders for an account
9. Get pending or failed bets for a user
10. Get past trades (graded/settled and ungraded/unsettled)
11. Approve SportX contracts trading
12. Subscribe to market changes
13. Subscribe to live scores by game
14. Subscribe to order book changes by market
15. Subscribe to active orders
16. Lookup markets

We support betting in WSX, WETH, and USDC

In any case, to get started, you can either initialize via your ethereum private key or initialize via an existing web3 instance. Examples below assuming you are using environment variables to store sensitive information.

### Initializing via ethereum private key

For this you will need a URL of an Ethereum provider to connect to the network along with your Ethereum private key. For the provider url you can connect to https://rpc.sx.technology for SxStage & SxMainnet environment. For toronto, use this provider url https://rpc.sx.technology instead. This will get you connected to the SX chain. Make sure you pass in the correct urls for with the righ environments.

```typescript
import { Environments, newSportX } from "@sx-bet/sportx-js";

async function main() {
  const sportX = await newSportX({
    env: Environments.SxToronto,
    customSidechainProviderUrl: process.env.PROVIDER,
    privateKey: process.env.PRIVATE_KEY,
  });
  // or 

  const sportXToronto = await newSportX({
    env: Environments.SxToronto,
    customSidechainProviderUrl: process.env.PROVIDER,
    privateKey: process.env.PRIVATE_KEY,
})

}
```

Note that you do not need a SportX API key to get started.

### Initializing via an existing web3 instance.

```typescript
import { Environments, newSportX } from "@sx-bet/sportx-js";
import { providers } from "ethers";

async function main() {
  const sportX = await newSportX({
    env: Environments.SxToronto,
    sidechainProvider: new providers.Web3Provider(web3.currentProvider)
  });
}
```

`newSportX` returns a promise that resolves to an initialized SportX API object.

The following assumes you have an initialized sportX API object.

### Error handling

As a foreword the wrapper throws errors if parameters are bad, mismatched, or there is an internal error from the API. There are three types of errors the wrapper throws:

1. `APIError`. This error is a 4XX from the API. You can find the reason for the error in the `details` property object on the error itself. An example `details` property is

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "TAKER_INSUFFICIENT_BASE_TOKEN_ALLOWANCE"
}
```

"TAKER_INSUFFICIENT_BASE_TOKEN_ALLOWANCE" is the error code. The below sections will detail the possible `APIError` error codes that are possible for each method of the wrapper.

2. `APISchemaError`. This error is the wrapper throwing an error before it reaches the API. In this case, one of the passed arguments are malformed. It will say which passed argument is malformed. 

### Get all the active markets

This function uses pagination to retrieve active market data. The response will contain two values: **markets** and **nextKey**. For the next set of markets, the paginationKey must be provided.

Field Notes: 
- paginationKey (optional) - needed to iterate over all markets
- pageSize (optional) - the default AND max pageSize value is 50

```typescript
const data = await sportX.getActiveMarkets({
  paginationKey: "<myPaginationKey>",
  pageSize: 10
});

console.log(`active markets: ${data.markets}`);
console.log(`next pagination key: ${data.nextKey}`);
```
The above produces an object that contains two values: 

1) markets: Which produces an **array** of objects with the following schema:

```typescript
interface IMarket {
  status: string;
  marketHash: string;
  outcomeOneName: string;
  outcomeTwoName: string;
  outcomeVoidName: string;
  teamOneName: string;
  teamTwoName: string;
  type: string;
  gameTime: number;
  line?: number;
  reportedDate?: number;
  outcome?: number;
  teamOneScore?: number;
  teamTwoScore?: number;
  teamOneMeta?: string;
  teamTwoMeta?: string;
  marketMeta?: string;
  sportXeventId: string;
  sportLabel: string;
  sportId: number;
  leagueId: number;
  homeTeamFirst: boolean;
  leagueLabel?: string;
}
```

2) nextKey: Which provides a string value of the next **paginationKey**.

The `sportId` and `leagueId`'s actual names can be found by fetching the leagues and sports. See below.

`line` will either be a spread or a total. You can figure out which team the spread is attributed to by looking at `outcomeOneName` and `outcomeTwoName`.

Example for a money line market:

```json
{
  "status": "ACTIVE",
  "marketHash": "0xee848defbfe6ebd564c12fc15018498329c3f9093167fde0f74742503cb75939",
  "outcomeOneName": "Brett Johns",
  "outcomeTwoName": "Tony Gravely",
  "outcomeVoidName": "NO_GAME",
  "teamOneName": "Brett Johns",
  "teamTwoName": "Tony Gravely",
  "type": "MONEY_LINE",
  "gameTime": 1579991700,
  "sportXeventId": "1083108429,1624",
  "sportLabel": "Mixed Martial Arts",
  "sportId": 7,
  "leagueId": 34,
  "homeTeamFirst": true,
  "leagueLabel": "UFC",
  "group1": "UFC"
}
```

Example for a spread market:

```json
{
    "status": "ACTIVE",
    "marketHash": "0x319af9631cd3b8950747daada600fbeebf222e1ee18dea7f10c78be23c353029",
    "outcomeOneName": "M. Vondrousova -5",
    "outcomeTwoName": "S. Kuznetsova +5",
    "outcomeVoidName": "NO_GAME_OR_EVEN",
    "teamOneName": "M. Vondrousova",
    "teamTwoName": "S. Kuznetsova",
    "type": "SPREAD_GAMES",
    "gameTime": 1579586400,
    "line": -5,
    "sportXeventId": "669448,16242",
    "sportLabel": "Tennis",
    "sportId": 6,
    "leagueId": 1025,
    "homeTeamFirst": true,
    "leagueLabel": "WTA Australian Open",
    "group1": "WTA Australian Open"
},
```

Example for an over/under/total market:

```json
{
  "status": "ACTIVE",
  "marketHash": "0xa45de5dff4da161ef7c9170408f842c70f41a31800380d005a1a0a1e6abe67bb",
  "outcomeOneName": "Over 3",
  "outcomeTwoName": "Under 3",
  "outcomeVoidName": "NO_GAME_OR_EVEN",
  "teamOneName": "RKC Waalwijk",
  "teamTwoName": "VVV Venlo",
  "type": "OVER_UNDER_GOALS",
  "gameTime": 1579977900,
  "line": 3,
  "sportXeventId": "1088774097,1928",
  "sportLabel": "Soccer",
  "sportId": 5,
  "leagueId": 237,
  "homeTeamFirst": true,
  "leagueLabel": "Netherlands Eredivisie",
  "group1": "Netherlands Eredivisie"
}
```

There are no errors to handle for this endpoint. 

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
  homeTeamFirst: boolean;
}
```

Example output:

```json
[
  {
    "leagueId": 1,
    "label": "NBA",
    "sportId": 1,
    "homeTeamFirst": false
  },
  {
    "leagueId": 2,
    "label": "NCAA",
    "sportId": 1,
    "homeTeamFirst": false
  },
  {
    "leagueId": 3,
    "label": "NHL",
    "sportId": 2,
    "homeTeamFirst": false
  },
  {
    "leagueId": 29,
    "label": "English Premier League",
    "sportId": 5,
    "homeTeamFirst": true
  }
]
```

### Submit a new order to a market

_Note that to submit new orders you will first have to approve the SportX contracts for trading. See "Approve SportX contracts for trading"_

The odds in the API are all in a special implied format. For example, 2.0 (decimal) = 0.5 (implied). You'll need to convert your odds into implied in order to submit a new order to SportX. The odds you submit to place a new order on SportX are the odds you will receive as a bookmaker. Best explained with an example:

The payload you need to submit looks like this:

```typescript
interface INewOrder {
  marketHash: string;
  totalBetSize: string;
  percentageOdds: string;
  expiry: number;
  isMakerBettingOutcomeOne: boolean;
  baseToken: string;
}
```

`marketHash` is the hash of the market to place the order. You can get a list of active markets using `sportX.getActiveMarkets()` as above.

`totalBetSize` is the **maximum** amount you wish to bet on the market. Note that this is an _order_ so it might not be filled, partially filled, or fully filled.

`percentageOdds` is the implied odds you as a maker will receive in a special format. **Note that these are not the odds you are offering**! To convert between a maker (you) and taker odds, the formula is `takerImpliedOdds = 1 - makerImpliedOdds`

`expiry` is the expiry date of the order as a Unix timestamp. After this date, this order will be automatically removed and invalidated.

`isMakerBettingOutcomeOne` is `true` or `false` depending on if you as the maker wish to bet on outcome one or outcome two. You can see what the outcomes are in the `IMarket` schema above.

`baseToken` is the token you wish to make the order in.

Some of these fields might have to be converted to a special format before submitting, but utilities are supplied for that.

Example:

```typescript
import { parseUnits } from "ethers/utils";
import moment from "moment";
import {
  convertToAPIPercentageOdds,
  convertToTrueTokenAmount
} from "@sx-bet/sportx-js";

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
  baseToken: "0x44495672C86eEeE14adA9a3e453EEd68a338cdC1"
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

The following `APIError` error codes are possible for this endpoint:

- `INSUFFICIENT_BALANCE` - You do not have enough balance to submit a new order. The API considers all other orders you currently have outstanding on this particular (market,side,baseToken)

### Cancel an existing order

To cancel an order you've submitted via above, you simply need the `orderHash`es of the order you wish to cancel. To get this, you can use the `getActiveOrders(address)` to get a list of all your active orders (see below).

The cancellations are instant.

Example:

```typescript
const response = await sportX.cancelOrder([
  "0x066b9ce3e0b2e671695015db9cd772224120e03663e93d35ee447b86b2b49ef4",
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

If it failed, it will throw an `APISchemaError` or `APIError`.

The following `APIError` error codes are possible for this endpoint:

- `ORDERS_DONT_EXIST` - The orders you are cancelling no longer exist.

You can supply a second parameter if you wish to show a message to the user (if you are a user-facing application) as this is using `eth_signTypedData` behind the scenes. For example you could pass the string "Cancel orders":

```typescript
const response = await sportX.cancelOrder(
  ["0x066b9ce3e0b2e671695015db9cd772224120e03663e93d35ee447b86b2b49ef4"],
  "Cancel orders"
);
console.log(response);
```

### Get all orders on market(s)

To get all the orders for market(s), simply call `getOrders(marketHashes?: string[], maker?: string, baseToken?: string)`.

Example:

```typescript
const orders = await sportX.getOrders([
  "0x75f5d0544a38bf41afab5cfd0a2b40b8df32bd76d91bfa5ece47ba739b179e4d",
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
    "baseToken": "0x44495672C86eEeE14adA9a3e453EEd68a338cdC1",
    "maker": "0xaD90d89b23Fc80bCF70c3E8CC23a21ccADFBC95F",
    "totalBetSize": "150000000000000000000",
    "percentageOdds": "91485727650227679586",
    "expiry": 1560904200,
    "salt": "84548885320416437228828145919856326657411590956960346919167755421671785285427",
    "executor": "0xEBF9c090bb9E9cea54c1f5eC23c238aB42922289",
    "isMakerBettingOutcomeOne": true,
    "signature": "0x59c3c9c6da0ae1cc77072e43856cf8f4a6aa3f9caf737a33a279787ff34ecd94064bc3fc2a438bb317eb2a455d9b84b2e155a2c7eaf7f73a0b58fad9cd41a0da1b"
  },
  {
    "fillAmount": "0",
    "orderHash": "0x4b44c1c7f7f32ea42813c624e2bdef570333da214e617a1827445d78a594f259",
    "marketHash": "0x75f5d0544a38bf41afab5cfd0a2b40b8df32bd76d91bfa5ece47ba739b179e4d",
    "baseToken": "0x44495672C86eEeE14adA9a3e453EEd68a338cdC1",
    "maker": "0xaD90d89b23Fc80bCF70c3E8CC23a21ccADFBC95F",
    "totalBetSize": "75000000000000000000",
    "percentageOdds": "896417220308870961",
    "expiry": 1560904200,
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
import { convertToDisplayAmount } from "@sx-bet/sportx-js";
console.log(convertToDisplayAmount("150000000000000000000"));
```

which produces "150"

`orderHash` is the unique ID of the order

`marketHash` is the unique ID of the market

`maker` is the address who created this order

`totalBetSize` is the total size of the order

`baseToken` is the token this order is denominated in

`percentageOdds` is the implied odds the maker is receiving for this order. To convert into a readable implied odds, you can use:

```typescript
import { convertFromAPIPercentageOdds } from "@sx-bet/sportx-js";

const odds = "88985727650227679586";
const convertedOdds = convertFromAPIPercentageOdds(odds);
console.log(convertedOdds);
```

which outputs 0.8898572765022768 (note that some rounding will occur)

`expiry` is the time at which the order is no longer valid and cannot be filled.

`isMakerBettingOutcomeOne` says whether the maker is betting outcome one or not. See the data from `sportX.getActiveMarkets()` to see what the outcomes are for the market.

The below are for information purposes only and not needed to operate this API.

`salt` is a random number to differentiate between two otherwise identical orders

`executor` is the address actually submitting the transaction to fill the order on the blockchain

`signature` is the signature on the order payload by the maker to verify that the maker did indeed create this order.

### Filling orders

To actually fill orders on SportX, you will need the actual orders themselves which you can obtain from `getOrders()` as well as the amount(s) you want to fill each order.

_Note that to submit orders you will first have to approve the SportX contracts for trading. See "Approve SportX contracts for trading"_

The orders are filled meta style, meaning that the filler does not pay for gas and instead the user just signs an "intent to fill" hash. The API covers the gas fee.

The signature is

`fillOrders(orders: ISignedRelayerMakerOrder[], betAmounts: string[], fillDetailsMetadata?: IFillDetailsMetadata, affiliateAddress?: string, approvalTx?: string)`

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
    salt: "109465971184042040832918255631084373861510812876584310918706085768814010131009"
    totalBetSize: "250000000000000000000"
    baseToken: "0x44495672C86eEeE14adA9a3e453EEd68a338cdC1"
    signature: "0x413dda285693ecac431b8346b41c4aa618a703e489b6aa93215ccdf83e4a03326da1099a07b14c3d513c16f7a94297c1b59ab18d3350d6551410d18043d965101b"
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

If you wish to submit an approval transaction for an amount of at least the bet amount to the ERC20 token (instead of providing unlimited allowance to the SportX smart contracts) prior, you can craft the transaction, use `eth_signTransaction` to sign it, and submit the encoded version as the `approvalTx` parameter. On the backend, we will relayer the transaction for you, but provide you with an instant (optimistic) confirmation.

Moreover, if you are a user facing application, similar to cancel order, you can pass an object with the format

```typescript
export interface IFillDetailsMetadata {
  action: string;
  market: string;
  betting: string;
  stake: string;
  odds: string;
  returning: string;
}
```

as the `fillDetailsMetadata` parameter to show the user some information using `eth_signTypedData`.

The following `APIError` error codes are possible for this endpoint:

- `ORDERS_NOT_UNIQUE` - Ensure that the order hashes of the orders passed are unique. If you want to fill the same order multiple times, increase the amount instead
- `INCORRECT_ARRAY_LENGTHS` - The length of the `orders` array is not the same as the `betAmounts` array. Ensure they are the same.
- `ORDERS_DONT_EXIST` - The orders you are trying to fill do not exist.
- `TOO_CLOSE_TO_ORDER_EXPIRY` - The order is too close to its expiry. The API prevents filling orders too close to their expiry due to the time it takes to mine a block on Ethereum
- `TAKER_AMOUNT_TOO_LOW` - One of the bet amounts in `betAmounts` is too low. Ensure that it meets the minimum as specified in the `getMetadata()` endpoint.
- `BASE_TOKENS_NOT_SAME` - The base tokens of the orders are not the same. Ensure they are the same.
- `MARKETS_NOT_SAME` - The markets of the orders are not the same. Ensure they are the same.
- `DIRECTIONS_NOT_SAME` - The directions of the orders are not the same. Ensure they are the same.
- `NOT_MAIN_LINE` - For spread and over under markets where the "line" is changing, you can only currently fill orders on the "main" or "vegas" line. 
- `META_TX_RATE_LIMIT_REACHED` - There is a maximum of 3 orders that can be submitted at once for each `taker` to prevent spam.
- `INSUFFICIENT_SPACE` - One of the orders you are trying to fill has insufficient space. i.e., the bet amount is too high for this particular order.
- `FILL_ALREADY_SUBMITTED` - This exact fill has already been submitted. Perhaps you have called the endpoint twice with identical parameters.
- `BAD_AFFILIATE` - The affiliate passed is not registered or malformed.

The following are only valid if you passed an `approvalTx` parameter

- `APPROVAL_TX_BAD_TRANSACTION_FORMAT` - The format of the encoded transaction is bad.
- `APPROVAL_TX_SIGNATURE_NOT_PRESENT` - The transaction is not signed
- `APPROVAL_TX_TARGET_INVALID` - The `to` field for the approval transaction is not to the correct token
- `APPROVAL_TX_VALUE_NOT_ZERO`- The approval tx cannot have any `value` specified
- `APPROVAL_TX_FROM_UNDEFINED` - The `from` parameter is undefined or does not match the taker
- `APPROVAL_TX_BAD_CHAIN_ID` - The chainId in the transaction is invalid
- `APPROVAL_TX_BAD_NONCE` - The nonce of the approval tx is bad.
- `APPROVAL_TX_BAD_DECODED_ARGUMENTS` - The `data` field of the transaction is malforemd
- `APPROVAL_TX_INCORRECT_APPROVAL_TARGET` - The contract to be approved is incorrect. It must be the TokenTransferProxy address. See the `TOKEN_TRANSFER_PROXY_ADDRESS` constant.
- `APPROVAL_TX_INSUFFICIENT_ALLOWANCE` - The allowance amount is insufficient. It must be greater than or equal to the amount of tokens that will be withdrew from the taker's account.

### Get all active orders for an account

To get all the active (unfilled or partially filled) orders for an account, you can do the following:

```typescript
const activeOrders = await sportX.getOrders(
  undefined,
  "0xF59E93290383ED15F73Ee923EbbF29f79e37B6d8"
);
console.log(activeOrders);
```

Which produces:

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
    "salt": "35485978637141361876232738522929776286192680166268767752859378082539513060903",
    "executor": "0xEBF9c090bb9E9cea54c1f5eC23c238aB42922289",
    "baseToken": "0x44495672C86eEeE14adA9a3e453EEd68a338cdC1",
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
    "baseToken": "0x44495672C86eEeE14adA9a3e453EEd68a338cdC1",
    "salt": "78496959933119259419935033215094016205058812453361105019042873506621461421155",
    "executor": "0xEBF9c090bb9E9cea54c1f5eC23c238aB42922289",
    "isMakerBettingOutcomeOne": true,
    "signature": "0xf119ed45ac127538eae88d07c048f41d881c2699d13f18b02edf54c04783dc9c4f877dba0fc153d5394e6d2fb9bcbbce1aea265ac16c70489e648bad4568bb901c"
  }
]
```

### Get pending or failed bets for a user

Bets are instantly confirmed but they might have not settled yet on the blockchain or in rare cases they might have failed. You can query bets that have yet to be settled using `sportX.getPendingOrFailedBets(bettor, startDate?, endDate?, fillHash?, baseToken?)`. _Note that this only works if the `bettor` is the taker in the trade_

Example:

```typescript
const pendingOrFailedBets = await sportX.getPendingOrFailedBets({
  bettor: "0xaD90d89b23Fc80bCF70c3E8CC23a21ccADFBC95F",
  startDate: 1590088356,
  endDate: 1580411556,
  fillHash:
    "0xe0e0802da0681030e43e4bb26209381f3be60193dd7a6ee3e70758751e417e24",
  baseToken: "0x44495672C86eEeE14adA9a3e453EEd68a338cdC1",
});
console.log(pendingOrFailedBets);
```

Which produces the details of the bets like so:

```json
[
  {
    "fillAmounts": ["44726667169493745756"],
    "orderHashes": [
      "0xe0cacd1adbc174b325d670ccb9dda58482b8921bf263fe4567c306ad5e2d7e96"
    ],
    "taker": "0xaD90d89b23Fc80bCF70c3E8CC23a21ccADFBC95F",
    "status": "PENDING",
    "betTime": 1590089356,
    "fillHash": "0xe0e0802da0681030e43e4bb26209381f3be60193dd7a6ee3e70758751e417e24",
    "baseToken": "0x44495672C86eEeE14adA9a3e453EEd68a338cdC1"
  }
]
```

The possible statuses can be "TIMEOUT", "FAIL", or "PENDING"

### Get past trades (graded/settled and ungraded/unsettled)

You can get past trades for your account (regardless if you were the maker or taker in the trade), as well as query for trades that are still pending or unsettled using `getTrades(tradeRequest: IGetTradesRequest)`

where the payload looks like:

```typescript
export interface IGetTradesRequest {
  startDate?: number;
  endDate?: number;
  bettor?: string;
  settled?: boolean;
  marketHashes?: string[];
  baseToken?: string;
  maker?: boolean;
}
```

Example (getting unsettled trades):

```typescript
const unsettledTrades = await sportX.getTrades(
  1575912953,
  1576008230,
  false,
  false,
  ["0x79dc0ebbfd89de79f5ee0f1e495480fbea3efb341e3087b2852915c0d5c0d450"],
  "0xa6dd914D83Fb3826f4881009D8537FE8f85D7c23",
  false
);
console.log(unsettledTrades);
```

`startDate` is in unix seconds. If present, all trades will be after this time
`endDate` is in unix seconds. If present, all trades will be before this time.
`bettor` is one of the bettors in the trade. Note that a full trade between two parties is split into two objects.
`settled` is true or false. You can search for only unsettled trades or settled trades using this.
`marketHashes` allows you to filter by certain markets only
`baseToken` allows you to filter by certain tokens only
`maker` allows you to sort by trades where the bettor is the maker only, or the taker only.

Which produces unsettled trades like so:

```json
[
  {
    "baseToken": "0x44495672C86eEeE14adA9a3e453EEd68a338cdC1",
    "bettor": "0xaD90d89b23Fc80bCF70c3E8CC23a21ccADFBC95F",
    "stake": "46176499173875012149",
    "odds": "82198961937716262976",
    "orderHash": "0xe41ecf31600664ccb02fca45205960512f9858772bb40383db29efeeea451555",
    "marketHash": "0x17a16c619f6668d55c83369c3ad1efa95dc8c24a06a004fb09b128e23e5b2aeb",
    "maker": true,
    "betTime": 1579194269,
    "settled": true,
    "bettingOutcomeOne": false
  },
  {
    "baseToken": "0x44495672C86eEeE14adA9a3e453EEd68a338cdC1",
    "bettor": "0x89181a0E0a9de0B5B21033e5b5A1dEBFcf097065",
    "stake": "9999999999999999999",
    "odds": "17801038062283737024",
    "orderHash": "0xe41ecf31600664ccb02fca45205960512f9858772bb40383db29efeeea451555",
    "marketHash": "0x17a16c619f6668d55c83369c3ad1efa95dc8c24a06a004fb09b128e23e5b2aeb",
    "maker": false,
    "betTime": 1579194269,
    "settled": false,
    "bettingOutcomeOne": true
  }
]
```

### Approve SportX contracts for trading

Before you are able to fill orders or submit new orders, you need to approve the SportX contracts for trading. You can do this by simply calling:

```typescript
const approvalTxn = await sportX.approveSportXContracts(tokenAddress);
console.log(approvalTxn);
```

where `tokenAddress` is the address of the token you wish to bet in. 

which produces:

```json
{
  "status": "success",
  "data": {
    "hash": "0x71a67000f7bfd91db39115abd437dc33c7bd774d981d11ac54e00606ea11fa95"
  }
}
```

You can track the status of the transaction on https://etherscan.io with the hash given by `hash`. Once this is complete, you will be able to place fill orders and submit new orders.

### Subscribe to market changes

To subscribe to market changes (game time changes, market is graded, market is invalidated, new market is created), you can do the following

```typescript
const realtime = await sportX.getRealtimeConnection();
const channel = realtime.channels.get(`markets`);
channel.subscribe((message) => {
  console.log(message);
});
// When done, channel.detach()
```

Here, `message` will be a market object in the same format you receive from `getActiveMarkets()`. Here is how you should update your collection:

1. If the market does not exist in your collection, it is a new market, otherwise it should be replaced by `marketHash` field.
2. If the market has a status of "INACTIVE", it means that the market has been invalidated and you should remove it from your collection.

### Subscribe to live scores by game

To subscribe to live scores, you can do the following:

```typescript
const realtime = await sportX.getRealtimeConnection();
const channel = realtime.channels.get(`live_scores`);
channel.subscribe((message) => {
  console.log(message);
});
// When done, channel.detach()
```

Here, `message` will be a live score object that looks like this.

```typescript
export interface IDbLiveScores {
  period: string;
  teamOneScore: number;
  teamTwoScore: number;
  providerEventId: string;
  providerLeagueId: number;
  periodTime?: string;
  sportId: number;
}
```

Example:

```json
{
  "sportId": 1,
  "teamOneScore": 56,
  "teamTwoScore": 88,
  "sportXeventId": "3434994,1221",
  "periodTime": "43:56",
  "period": "Q4"
}
```

You can map these back to the markets in `getActiveMarkets()` by using `sportXeventId`.

### Subscribe to order book changes by market

To subscribe to order book updates, you can do the following. You need the `marketHash` and the `baseToken` of the orders you are subscribing to:

```typescript
const realtime = await sportX.getRealtimeConnection();
const baseToken = "0x44495672C86eEeE14adA9a3e453EEd68a338cdC1";
const marketHash =
  "0xde2b8cf87f9f63e115a0adfeab3fa4191501fb10d7aef5c76099f475d3407caf";
const channel = realtime.channels.get(`order_book:${baseToken}:${marketHash}`);
channel.subscribe((message) => {
  console.log(message);
});
// When done, channel.detach()
```

The updates will be in an array and will look identical to those produced in `getOrders()`. You can use these simple rules to update your collection:

1. If the order does not exist and has `status: "ACTIVE"`, you can add it to your collection.
2. If the order exists by `orderHash` and the update order has `status: "ACTIVE"`, you should replace the order.
3. If the order exists by `orderHash` and the update order has `status: "INACTIVE"`, you should remove that order from your collection.

### Subscribe to active orders

To subscribe to active order updates for an address (for instance if you are a market maker), you need the ethereum address of the market maker, and the `baseToken` of orders you wish to track:

```typescript
const realtime = await sportX.getRealtimeConnection();
const baseToken = "0x44495672C86eEeE14adA9a3e453EEd68a338cdC1";
const maker = "0xc815634b516B63178A09dF7aAB013A520854F4f5";
const channel = realtime.channels.get(`active_orders:${baseToken}:${maker}`);
channel.subscribe((message) => {
  console.log(message);
});
// When done, channel.detach()
```

The updates will be in an array and will look identical to those produced in `getOrders()`. You can use these simple rules to update your active order collection:

1. If the order does not exist and has `status: "ACTIVE"`, you can add it to your collection.
2. If the order exists by `orderHash` and the update order has `status: "ACTIVE"`, you should replace the order.
3. If the order exists by `orderHash` and the update order has `status: "INACTIVE"`, you should remove that order from your collection.

### Lookup markets

You can lookup markets by marketHash by using `marketLookup(marketHashes)`.

```typescript
const markets = await sportX.marketLookup([
  "0xde2b8cf87f9f63e115a0adfeab3fa4191501fb10d7aef5c76099f475d3407caf",
]);
console.log(markets);
```

which produces an output in the same format as `getActiveMarkets()`. Example:

```json
[
  {
    "status": "ACTIVE",
    "marketHash": "0xde2b8cf87f9f63e115a0adfeab3fa4191501fb10d7aef5c76099f475d3407caf",
    "outcomeOneName": "Brett Johns",
    "outcomeTwoName": "Tony Gravely",
    "outcomeVoidName": "NO_GAME",
    "teamOneName": "Brett Johns",
    "teamTwoName": "Tony Gravely",
    "type": "MONEY_LINE",
    "gameTime": 1579991700,
    "sportXeventId": "1083108429,1624",
    "sportLabel": "Mixed Martial Arts",
    "sportId": 7,
    "leagueId": 34,
    "homeTeamFirst": true,
    "leagueLabel": "UFC",
    "group1": "UFC"
  }
]
```

## Debugging

We use https://www.npmjs.com/package/debug to provide debugging support for consumers of this package. Simply

`export DEBUG=sportx-js`

and you will see raw responses from the SportX relayer.
