import * as tmp from 'tmp';

import HangManState from './hangman';
import Test from './test-utils';

let test = new Test();

let dbPath = tmp.fileSync().name;
let hangManState = new HangManState({word : "Hello", user : 'miki', dbPath});

test.notMatches("hangManState constructed", hangManState, void(0));
{
  test.header('Just Instantiate');

  let {displayWord} = hangManState.getStateREST();
  test.matches('No letters visible', displayWord, '_____');
}

{
  test.header('Incorrectly Guess Q');

  hangManState.guessLetter('q');
  let state = hangManState.getStateREST();
  let {gameLost} = state;
  let {incorrectlyGuessedCount, incorrectlyGuessedLetters} = state;

  test.matches('1 wrong guess', incorrectlyGuessedCount, 1);
  test.matches('Q is incorrectly guessed', incorrectlyGuessedLetters.toString(), 'Q');
  test.matches('Game not lost yet', gameLost, false);
}

{
  test.header('Correctly Guess L');

  hangManState.guessLetter('l');
  let state = hangManState.getStateREST();
  let {displayWord} = state;
  let {incorrectlyGuessedCount, incorrectlyGuessedLetters} = state;

  test.matches('L\'s visible', displayWord, '__LL_');
  test.matches("still 1 wrong guess", incorrectlyGuessedCount, 1);
}

{
  test.header('Lost Game');

  let prematureLoss = false;

  let cookieState = hangManState.toCookie();
  hangManState = undefined; // test toCookie() and fromCookie constructor

  // go through a bunch of incorrect guesses
  // Some doubles, which shouldn't count twice
  ['a', 'b', 'c', 'D', 'F', 'g', 'I', 'j', 'j', 'j'].forEach((letter) => {
    hangManState = new HangManState({fromCookie : cookieState, dbPath});

    hangManState.guessLetter(letter); // get a variety in there
    let {gameLost} = hangManState.getStateREST();

    prematureLoss = prematureLoss || gameLost;

    // more testing of freezing and thawing
    cookieState = hangManState.toCookie();
    hangManState = undefined;
  });

  hangManState = new HangManState({fromCookie : cookieState, dbPath});

  {
    test.matches('No premature loss', prematureLoss, false);

    let {incorrectlyGuessedCount, incorrectlyGuessedLetters} = hangManState.getStateREST();
    test.matches('Incorrect guess count', incorrectlyGuessedCount, 9);
    test.matches('What letters were wrong', incorrectlyGuessedLetters.toString(), 'A,B,C,D,F,G,I,J,Q')
  }

  {
    hangManState.guessLetter('k');
    let {gameLost, winCount, lossCount} = hangManState.getStateREST();
    test.matches('Now, you loose', gameLost, true);
    test.matches('Counted W/L\'s right', winCount + '/' + lossCount, '0/1');
  }


}

{
  test.header('Won Game');

  // re-initiallize
  let hangManState = new HangManState({word : "Hello", user : "miki", dbPath});

  hangManState.guessLetter('h');
  hangManState.guessLetter('E');
  hangManState.guessLetter('l');

  {
    let {gameWon, displayWord} = hangManState.getStateREST();

    test.matches('No premature winning', gameWon, false);
    test.matches('What are we displaying?', displayWord, 'HELL_');
  }

  hangManState.guessLetter('O');

  {
    let state = hangManState.getStateREST();
    let {gameWon, displayWord} = state;
    let {winCount, lossCount} = state;

    test.matches('Now we won!!!', gameWon, true);
    test.matches('And display the whole word', displayWord, 'HELLO');
    test.matches('Counted W/L\'s right', winCount + '/' + lossCount, '1/1');
  }
}

test.done();
