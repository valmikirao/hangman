// this project is probably overkill for react, but it's the modern
// framework I know

import * as React from 'react';

// our components don't need states, so
// this helps make writing that easier
export class Component<T> extends React.Component<T, undefined> {}
