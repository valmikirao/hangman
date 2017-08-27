import * as ReactDOM from 'react-dom';
import * as React from 'react';
import { createStore } from 'redux';
import { connect, Provider }  from 'react-redux';
import * as queryString from 'query-string';
import 'isomorphic-fetch';
import 'es6-promise';

import HangManState, {HangManStateREST} from '../hangman'; // just want the types
import {Component} from './common-react';
import {HangManASCII} from './hangman-ascii';
import {InitArgs, GuessLetterArgs} from '../rest';

interface StateError {error : true};
interface StateInit {init : true};

type HangManStateView = HangManStateREST | StateError | StateInit;

interface HangManStateProps {
  gameState : HangManStateView,
};

interface SetGameStateType {
  (gameState : HangManStateView) : {
    action : string,
    gameState : HangManStateView,
  }
};

interface HangManDispatchProps {
  setGameState : SetGameStateType,
};

interface HangManOwnProps {
  initUser : string;
}

interface RestartLinkProps {
  setGameState : SetGameStateType,
  user : string | null,
}

type HangManProps = HangManStateProps & HangManDispatchProps & HangManOwnProps;

type ActionType = {
  type : 'SET' | 'INIT',
  gameState : HangManStateView,
}

function rest<T, U>(url : string, args : T) : Promise<U | StateError> {
  let body = void(0);

  if (args !== void(0)) {
    body = JSON.stringify(args);
  }

  let promise =
    fetch(url, {
      body,
      method : 'POST',
      headers : {'Content-Type': 'application/json'},
      credentials: 'same-origin', // to send cookies
    })
    .then(
      (response) => response.json()
    )
    .catch(
      () => ({error : true})
    )

  return promise;
}

function guessLetterREST(letter : string) : Promise<HangManStateView> {
  let promise = rest('/rest/guessLetter', {letter});

  return promise as Promise<HangManStateView>;
}

interface YouWonOrLostProps {
  gameWon : boolean,
  gameLost : boolean,
  winCount : number | undefined,
  lossCount : number | undefined,
};

class GameOver extends Component<YouWonOrLostProps> {
  public render() {
    let {gameWon, gameLost} = this.props;

    let gameOver = gameWon || gameLost;

    let inner : JSX.Element[] = [];

    // for unique key children need
    let key = 0;

    if (gameOver) {
      if (gameWon) {
        inner.push(<div className="game-won" key={key++}>You Won!!!!</div>);
      }
      else if (gameLost) {
        inner.push(<div className="game-lost" key={key++}>You Lost :-(</div>);
      }

      let {winCount, lossCount} = this.props

      inner.push(<div className="game-record" key={key++}>{winCount} games won, {lossCount} games lost</div>);
    }

    return <div className="game-over" hidden={! gameOver }>{ inner }</div>;
  }
}

class RestartLink extends Component<RestartLinkProps> {
  public render() {
    let {setGameState, user} = this.props;

    const handleClick = () => rest<InitArgs, HangManStateREST>('/rest/init', {user})
      .then(gameState => {
        setGameState(gameState)
      });

    return <div className="restart-link" onClick={handleClick}>(restart game)</div>;
  }
}

function gameStateIsError(gameState : HangManStateView) : gameState is StateError {
    let {error = false} = gameState as StateError;

    return error;
}

function gameStateIsInit(gameState : HangManStateView) : gameState is StateInit {
    let {init = false} = gameState as StateInit;

    return init;
}


class _HangMan extends Component<HangManProps> {
  public render() {
    let {gameState, setGameState} = this.props;

    let inner : JSX.Element[] = [];

    // for unique key children elements need
    let key = 0;

    if (gameStateIsError(gameState)) {
      inner.push(<div key={key++} className="error">ERROR!</div>);
    }
    else if (gameStateIsInit(gameState)) {
      // nothing happening while initializing
      inner.push(<div/>)
    }
    else {
      let gameStateValid = gameState;
      let {incorrectlyGuessedCount, incorrectlyGuessedLetters, gameLost, lossCount} = gameStateValid;
      let {displayWord, gameWon, winCount, user} = gameStateValid;

      inner.push(
        <HangManASCII key={key++} incorrectlyGuessedCount={ incorrectlyGuessedCount }/>,
        <div key={key++} className="incorrectly-guessed-letters">{ incorrectlyGuessedLetters }</div>,
        <div key={key++} className="display-word">{ displayWord }</div>,
        <GameOver key={key++}
          gameWon={gameWon}
          gameLost={gameLost}
          winCount={winCount}
          lossCount={lossCount}
        />,
        <RestartLink setGameState={setGameState} user={user}/>,
      );

    }

    return <div className="game">
      { inner }
    </div>;
  }

  private readonly getHandleKeyPress =
    ({setGameState} : {setGameState : SetGameStateType}) =>
    (event : KeyboardEvent) =>
      {
        let {gameState} = this.props;

        let gameOver = false;
        if (!gameStateIsError(gameState) && !gameStateIsInit(gameState)) {
          gameOver = gameState.gameWon || gameState.gameLost;
        }

        if (! gameOver) {
          let letter = event.key;

          guessLetterREST(letter)
            .then((gameState) => setGameState(gameState));
        }
      };

  private handleKeyPress : {(KeyboardEvent) : void} | null
    = null;


  public componentDidMount() {
    let {setGameState} = this.props;
    let {initUser, gameState} = this.props;

    // this is how I can figure out how to get the keypress on the body
    // there might be an easier/more sensible way?  Internet says no
    this.handleKeyPress = this.getHandleKeyPress({setGameState})
    let bodyDOM = document.getElementById('body');
    bodyDOM.addEventListener('keypress', this.handleKeyPress);

    if (gameStateIsInit(gameState)) {
      rest<InitArgs, HangManStateREST>('/rest/init', {user : initUser})
        .then(gameState => {
          setGameState(gameState)
        });
    }
  }

  public componentWillUnmount() {
    // Internet says do this, which makes sense

    let bodyDOM = document.getElementById('body');
    bodyDOM.removeEventListener('keypress', this.handleKeyPress);
  }
}

function mapStateToProps (
  state : HangManStateProps,
  ownProps : HangManOwnProps,
) {
  let {gameState} = state;
  let {initUser} = ownProps;

  return {gameState, initUser}
}

function mapDispatchToProps(dispatch) : {setGameState : SetGameStateType} {
  return {
    setGameState : (gameState) =>
      dispatch({
        type : 'SET',
        gameState
      }),
  };
}

const HangMan = connect<HangManStateProps, HangManDispatchProps, HangManOwnProps>(
  mapStateToProps,
  mapDispatchToProps,
)(_HangMan);


function reducer(state, action : ActionType) : {gameState : HangManStateView} {
  switch (action.type) {
    case 'SET' : {
      return {
        gameState : action.gameState
      };
    }
    case 'INIT' : {
      return {
        gameState : {init : true}
      }
    }
    default : {
      return {
        gameState : {init : true}
      };
    }
  }
}

function main() {
  let {user} : {user : string} = queryString.parse(document.location.search);

  let store = createStore(reducer);
  store.dispatch({type : 'INIT'});

  ReactDOM.render(
    <Provider store={store}>
      <HangMan initUser={user}/>
    </Provider>,
    document.getElementById('root'),
  );
}

main();