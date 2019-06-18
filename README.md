# sportx-js

## Install

`yarn add sportx-js`

or

`npm i sportx-js`

This library is written in TypeScript and compiled down to es6.

## Usage

You can do the following things with this API:

1. Get all the active markets
2. Get all the sports supported by SportX
3. Get all the leagues supported by SportX
4. Submit a new order to a market
5. Cancel an existing order
6. Get bets that have not settled yet (for a taker)
7. Get all orders on a market
8. Get all active bookmaker orders for an account
9. Subscribe to a market and get updates when that market's orders change
10. Subscribe to an address and get updates when that addresses' bookmaker orders change

In any case, to get started, you'll need your private key and the environment you want to use. We recommend starting on rinkeby first. Example:

```typescript
import { Environments, newSportX } from "@sportx-bet/sportx-js";

async function main() {
    const sportX = await newSportX(Environments.RINKEBY, process.env.PRIVATE_KEY)
}

```

`newSportX` returns a promise that resolves to an initialized SportX API object.

The following assume you have an initialized sportX API object.

### Get all the active markets

```typescript
const activeMarkets = await sportX.getActiveMarkets();
console.log(activeMarkets)
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
console.log(sports)
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
[{"sportId":1,"label":"Basketball"},{"sportId":2,"label":"Hockey"},{"sportId":3,"label":"Baseball"},{"sportId":4,"label":"Golf"},{"sportId":5,"label":"Soccer"},{"sportId":6,"label":"Tennis"},{"sportId":7,"label":"Mixed Martial Arts"},{"sportId":8,"label":"Football"},{"sportId":10,"label":"Custom"}]
```

### Get all the leagues supported by SportX

```typescript
const leagues = await sportX.getLeagues();
console.log(leagues)
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
[{"leagueId":10002,"label":"F1 Race","sportId":10,"referenceUrl":"sportx.bet","homeTeamFirst":true},{"leagueId":10000,"label":"League of Legends","sportId":9,"referenceUrl":"lol.com","homeTeamFirst":true},{"leagueId":1,"label":"NBA","sportId":1,"referenceUrl":"NBA.com","homeTeamFirst":false},{"leagueId":2,"label":"NCAA","sportId":1,"referenceUrl":"NCAA.com","homeTeamFirst":false},{"leagueId":3,"label":"NHL","sportId":2,"referenceUrl":"NHL.com","homeTeamFirst":false},{"leagueId":4,"label":"The Masters_Tournament","sportId":4,"referenceUrl":"masters.com","homeTeamFirst":true},{"leagueId":5,"label":"The Masters_Round 1","sportId":4,"referenceUrl":"masters.com","homeTeamFirst":true},{"leagueId":6,"label":"The Masters_Round 2","sportId":4,"referenceUrl":"masters.com","homeTeamFirst":true},{"leagueId":7,"label":"The Masters_Round 3","sportId":4,"referenceUrl":"masters.com","homeTeamFirst":true}]
```






