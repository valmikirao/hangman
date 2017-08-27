import * as seed from 'seed-random';
import * as tmp from 'tmp';

import Test from './test-utils';
import Model from './model';

let test = new Test();
let random = seed('Bob Blah Law');

test.header('getRandomWord');

test.matches('getRandomWord 1', Model.getRandomWord({random}), 'maunderer');
test.matches('getRandomWord 2', Model.getRandomWord({random}), 'snortier');
test.matches('getRandomWord 3', Model.getRandomWord({random}), 'shipway');

test.header('Store Win/Loss history');

let tmpDBPath = tmp.fileSync().name;

{
  Model.storeUserRecord({
    user : 'miki',
    dbPath : tmpDBPath,
    userRecord : {winCount : 2, lossCount : 3}
  });

  let {winCount, lossCount} = Model.getUserRecord({user : 'miki', dbPath : tmpDBPath});

  test.matches("Stored two wins", winCount, 2);
  test.matches("Stored three losses", lossCount, 3);

}

{
  let {winCount, lossCount} = Model.updateUserRecord({
    user : 'miki',
    dbPath : tmpDBPath,
    updateWith : ({winCount, lossCount}) => {
      // double everything!!!
      winCount *= 2;
      lossCount *= 2;

      return {winCount,lossCount}
    }
  });

  test.matches("Updated double wins", winCount, 4);
  test.matches("Updated doube losses", lossCount, 6);
}

{
  let {lossCount} = Model.updateUserRecord({
    user : 'nikki',
    dbPath : tmpDBPath,
    updateWith : ({lossCount, winCount}) => {
      return {
        lossCount : lossCount + 1,
        winCount : 0,
      }
    },
  });

  test.matches("Losscount just 1, different user", lossCount, 1);
}
