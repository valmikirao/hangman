import HangManState from './hangman';
import Model from './model';
import * as path from 'path';

export interface InitArgs {
  user : string,
}

export interface GuessLetterArgs {
  letter : string,
}

const cookieParams = {
  httpOnly : true,
  signed : true,
};

function guessLetter(req, res, next) : void {
  let {letter} = req.body as GuessLetterArgs;

  let cookieHangManState = req.signedCookies.hangManState;
  let hangManState = new HangManState({fromCookie : cookieHangManState});

  hangManState.guessLetter(letter);

  cookieHangManState = hangManState.toCookie();
  // should be an encrypted cookie
  res.cookie('hangManState', cookieHangManState, cookieParams);

  res.json(hangManState.getStateREST());

}

function init(req, res, next) : void {
  let {user} = req.body as InitArgs;

  let word = Model.getRandomWord();
  let hangManState = new HangManState({word, user});

  let cookieHangManState = hangManState.toCookie();

  res.cookie('hangManState', cookieHangManState, cookieParams);

  res.json(hangManState.getStateREST());
}

// pretty sure this is not the way you're supposed to do this usually
// but good enough for now
function useRest(app : any) : void {
  app.post('/rest/guessLetter', guessLetter);
  app.post('/rest/init', init);
}

export default useRest;