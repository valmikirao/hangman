/*
    Just need super simple test utils,
    everything on npm is too complicate
    for such a simple project or doesn't work well
    in typescript
*/

import {sprintf} from 'sprintf-js';

class Test {
    private passCount = 0;
    private failCount = 0;

    public matches<T>(description : string, value : T, match : T) : boolean {
        const matchSuccess = value === match;


        let valueDisplay;
        let okDisplay;
        if (matchSuccess) {
            this.passCount++;
            valueDisplay = value;
            okDisplay = 'ok';
        }
        else {
            this.failCount++;
            valueDisplay = match + ' !== ' + value;
            okDisplay = 'NOT ok';
        }

        console.log(sprintf(
            '%-75s [ %-20s ] ... %10s',
            description,
            valueDisplay,
            okDisplay,
        ));

        return matchSuccess;
    }

    public notMatches<T>(description : string, value : T, match : T) : boolean {
        const matchSuccess = value !== match;

        let valueDisplay;
        let okDisplay;
        if (matchSuccess) {
            this.passCount++;
            valueDisplay = value;
            okDisplay = 'ok';
        }
        else {
            this.failCount++;
            valueDisplay = match + ' === ' + value;
            okDisplay;
        }

        console.log(sprintf(
            '%-75s [ %-20s ] ... %10s',
            description,
            valueDisplay,
            okDisplay,
        ));

        return matchSuccess;
    }

    // silly function to help format the output nicer
    public header(text : string) : void {
        console.log("\n" + text);
        console.log('---------------------------');
    }

    public done() : void {
        const total = this.passCount + this.failCount;

        console.log(
            "\n%s tests, %s passed and %s failed",
            total,
            this.passCount,
            this.failCount,
        );
    }
}

export default Test;