import * as assert from 'assert';

import Model, {UserRecord} from './model';

// How to store the data structure in the session
// between calls
export interface HangManStateREST {
  user : string,
  incorrectlyGuessedLetters : string[],
  incorrectlyGuessedCount : number,
  displayWord : string,
  gameLost : boolean,
  gameWon: boolean,
  winCount? : number,
  lossCount? : number,
};

interface HangManStateCookie {
  // a boring, freezable version of the HangManState object
  // basically, no methods
  word : string;
  user : string;
  correctlyGuessedLettersObj : any;
  incorrectlyGuessedLettersObj : any;
  incorrectlyGuessedCount : number;
  winCount : number,
  lossCount : number,
};

type FromCookieArgs = {fromCookie? : HangManStateCookie};
type InitArgs = {word : string, user : string};

// this complicated structure doesn't work as I hoped
type HangManStateConstructorArgs =
  (InitArgs | FromCookieArgs) // either fromCookie or both username and word
  & {dbPath? : string}; // can always do dbPath, if wanted

function argsHaveCookie(args : HangManStateConstructorArgs) : args is FromCookieArgs {
  return 'fromCookie' in args;
}

class HangManState implements HangManStateCookie {

  word : string;
  user : string;
  correctlyGuessedLettersObj : any = {};
  incorrectlyGuessedLettersObj : any = {};
  incorrectlyGuessedCount : number = 0;

  winCount : number = undefined;
  lossCount : number = undefined;

  public static readonly maxIncorrectGuesses : number = 10;

  private dbPath : string = undefined;

  constructor(args : HangManStateConstructorArgs) {
    if (argsHaveCookie(args)) {
      Object.assign(this, args.fromCookie);
      this.dbPath = args.dbPath;
    }
    else {
      let {word, user} = args;

      // We don't care about case here, so keep it upper
      this.word = word.toUpperCase();
      this.user = user;
      this.dbPath = args.dbPath;

      let {winCount, lossCount} = this.markInitialLoss();

      this.winCount = winCount;
      this.lossCount = lossCount;
    }

  }

  private markInitialLoss() : UserRecord {
    let {winCount, lossCount} = Model.updateUserRecord({
      user : this.user,
      dbPath : this.dbPath,
      updateWith : ({winCount, lossCount}) => {
        lossCount++;

        return {winCount, lossCount};
      }
    });

    return {winCount, lossCount};
  }

  // makes it so it can be stored as a cookie and then thawed later
  // kind of silly: makes everything potentially public, but makes the
  // point that things should be private
  public toCookie() : HangManStateCookie {
    // turns this into a boring, plain object
   return {
    word : this.word,
    user : this.user,
    correctlyGuessedLettersObj : this.correctlyGuessedLettersObj,
    incorrectlyGuessedLettersObj : this.incorrectlyGuessedLettersObj,
    incorrectlyGuessedCount : this.incorrectlyGuessedCount,
    winCount : this.winCount,
    lossCount : this.lossCount,
   };
  }

  public guessLetter(letter : string) : void {
    assert(letter.length === 1, 'Only single letters can be passed to this');
    assert(!this.gameWon() && !this.gameLost(), 'If the game is won or lost, you shouldn\'t still be playing');

    const upperLetter = letter.toLocaleUpperCase();
    const matched = this.word.match(upperLetter) ? true : false;

    if (matched) {
      this.correctlyGuessedLettersObj[upperLetter] = true;
    }
    else {
      if (! this.incorrectlyGuessedLettersObj[upperLetter]) { // don't double nick a wrong guess
        this.incorrectlyGuessedLettersObj[upperLetter] = true;
        this.incorrectlyGuessedCount++;
      }
    }

    if (this.gameWon()) {
      // game over, man
      let {winCount, lossCount} = Model.updateUserRecord({
        user : this.user,
        dbPath : this.dbPath,
        updateWith : ({winCount, lossCount}) => {
          winCount++;
          lossCount--; // clearing the previous loss

          return {winCount, lossCount};
        }
      });
      // the loss is already in there if they lost

      this.winCount = winCount;
      this.lossCount = lossCount;
    }
  }

  public getIncorrectlyGuessedLetters() : string[] {
    let incorrectlyGuessLetters = Object.keys(this.incorrectlyGuessedLettersObj);
    incorrectlyGuessLetters = incorrectlyGuessLetters.sort();

    return incorrectlyGuessLetters;
  }

  public getStateREST() : HangManStateREST {

    let incorrectlyGuessedLetters = this.getIncorrectlyGuessedLetters();

    let displayWord = this.getDisplayWord();
    let gameLost = this.gameLost();
    let gameWon = this.gameWon()

    let {incorrectlyGuessedCount} = this;
    let {winCount, lossCount, user} = this;

    return {
      user,
      incorrectlyGuessedLetters,
      incorrectlyGuessedCount,
      displayWord,
      gameLost,
      gameWon,

      // these two only  diffined if gameWon || gameLost
      winCount,
      lossCount,
    };
  }

  public gameLost() : boolean {
    // this one isn't rocket science
    return this.incorrectlyGuessedCount >= HangManState.maxIncorrectGuesses;
  }

  public gameWon() : boolean {
    const letters = this.word.split('');
    const unMatchedLetter = letters.find(
      (letter) => ! this.correctlyGuessedLettersObj[letter]
    );

    // no unmatched letter, we won!
    return unMatchedLetter === void(0);
  }

  public getDisplayWord() : string {

    if (this.gameLost()) {
      // just display the whole word if they lost
      return this.word;
    }
    else {
      const letters = this.word.split('');
      const displayLetters = letters.map(
        (letter) =>
          this.correctlyGuessedLettersObj[letter] ?
            letter
            : '_'
      );
      const displayWord = displayLetters.join('');

      return displayWord;
    }
  }

}


export default HangManState;