import * as fs from "fs";
import * as path from "path";
import * as seed from 'seed-random';
import * as WORD_LIST_PATH from 'word-list';

const GAME_RESULTS_DB_PATH = path.join(__dirname, '..', 'dat', 'highScores.json');

interface RandomFunctionType {() : number};
interface GetRandomWordArgs {random? : RandomFunctionType};

interface UpdateUserRecordFunc {
  (UserRecord) : UserRecord,
};

interface UpdateUserRecordArgs {
  user : string,
  dbPath? : string,
  updateWith : UpdateUserRecordFunc,
};

interface StoreUserRecordArgs {
  user : string,
  userRecord : UserRecord,
  dbPath? : string,
};

export interface UserRecord {
  winCount : number,
  lossCount : number,
}


interface UserRecordSchemaType {
  [user : string] : UserRecord,
}

function getDictionary() {
  /*
    Loading the whole dictionary like this makes me feel a little dirty,
    and the documentation for dictionary-en-us says to NEVER use readFileSync()
    in production, but this isn't production.  In real life, this would probably be in a DB.

    Also, considered caching it, but honestly think it's probably more efficient
    to load when needed
  */

  // for some reason, tsc needs this to realize that path is a string
  const path : string = WORD_LIST_PATH;

  let dictionaryRaw : string = fs.readFileSync(path, 'utf-8');
  return dictionaryRaw.split("\n");
}

function getRandomWord({random = seed()} : GetRandomWordArgs = {}) : string {
  let dictionary : string[] = getDictionary();

  let i = Math.floor(random() * dictionary.length);

  return dictionary[i];
};

function getGameResultsData({dbPath = GAME_RESULTS_DB_PATH}) : UserRecordSchemaType {
  try {
    let rawData : string = fs.readFileSync(dbPath, 'utf-8');

    return JSON.parse(rawData);
  }
  catch (e) {
    // pretty basic error catching: if there is a problem
    // reading or parsing the file, we just start the DB from scratch
    // in real world, this would be a real DB

    return {};
  }
}

function updateUserRecord(args : UpdateUserRecordArgs) : UserRecord {
  let {user, dbPath = GAME_RESULTS_DB_PATH, updateWith} = args;

  let userRecord = getUserRecord({user, dbPath});
  let newUserRecord = updateWith(userRecord);

  storeUserRecord({user, dbPath, userRecord : newUserRecord});

  return newUserRecord;
}

function storeUserRecord(args : StoreUserRecordArgs) : UserRecord {
  // make dbPath overridable for unit test
  let { user, dbPath = GAME_RESULTS_DB_PATH, userRecord} = args;

  let data : UserRecordSchemaType = getGameResultsData({dbPath});

  data[user] = userRecord;

  let frozenData = JSON.stringify(data);

  fs.writeFileSync(dbPath, frozenData, {encoding : 'utf-8'});

  return data[user];
}

function getUserRecord(args : {user : string, dbPath? : string}) : UserRecord {
  let {user, dbPath = GAME_RESULTS_DB_PATH} = args;

  let data : UserRecordSchemaType = getGameResultsData({dbPath});

  // if use doesn't exist, these will be set to zero
  let {winCount, lossCount} = user in data ?
    data[user]
    : {winCount : 0, lossCount : 0};

  return {winCount, lossCount};
}

const Model = {
  getRandomWord,
  getUserRecord,
  storeUserRecord,
  updateUserRecord,
};

export default Model;