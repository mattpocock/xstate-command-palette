import { useMachine } from '@xstate/react';
import React from 'react';
import { createMachine } from 'xstate';
import { initCommandPalette } from '../../src';

const machine = createMachine({
  initial: 'toggledOn',
  states: {
    toggledOn: {
      on: {
        TOGGLE: {
          target: 'toggledOff',
        },
        TURN_OFF: {
          target: 'toggledOff',
        },
      },
    },
    toggledOff: {
      on: {
        TOGGLE: {
          target: 'toggledOn',
        },
        TURN_ON: {
          target: 'toggledOn',
        },
      },
    },
  },
});

initCommandPalette();

function App() {
  const [state, send] = useMachine(machine, { devTools: true });
  // useMachine(machine, { devTools: true });
  // useMachine(machine, { devTools: true });
  return (
    <div className="App">
      <pre>{JSON.stringify(state.value)}</pre>
      <button onClick={() => send('TOGGLE')}>TOGGLE</button>
    </div>
  );
}

export default App;
