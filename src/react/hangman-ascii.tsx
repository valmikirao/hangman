import * as ReactDOM from 'react-dom';
import * as React from 'react';

import {Component} from './common-react';

export class HangManASCII extends Component<{incorrectlyGuessedCount : number}> {
    public render() {
        let {incorrectlyGuessedCount} = this.props;

        let ASCIIArt = HANG_MAN_ASCII_ART_ARRAY[incorrectlyGuessedCount];

        return <div className="hangman-ascii">{ASCIIArt}</div>;
    }
}

const HANG_MAN_ASCII_ART_ARRAY = [
`






`,
`






 ------`,
`
    |
    |
    |
    |
    |
    |
 ------`,
`     _________
    |
    |
    |
    |
    |
    |
 ------`,
`     _________
    |         |
    |
    |
    |
    |
    |
 ------`,
`     _________
    |         |
    |         0
    |
    |
    |
    |
 ------`,
`     _________
    |         |
    |         0
    |         |
    |
    |
    |
 ------`,
`     _________
    |         |
    |         0
    |        /|
    |
    |
    |
 ------`,
`     _________
    |         |
    |         0
    |        /|\\
    |
    |
    |
 ------`,
`     _________
    |         |
    |         0
    |        /|\\
    |        /
    |
    |
 ------`,
`     _________
    |         |
    |         0
    |        /|\\
    |        / \\
    |
    |
 ------`
]