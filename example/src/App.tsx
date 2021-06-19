import { useInterpret, useMachine } from '@xstate/react';
import React from 'react';
import { createMachine } from 'xstate';
import { initCommandPalette } from '../../src';

export const machine = createMachine({
  initial: 'toggledOn',
  id: 'toggleMachine',
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

const lightMachine = createMachine({
  key: 'trafficLightMachine',
  initial: 'green',
  states: {
    green: {
      on: {
        TIMER: { target: 'yellow' },
      },
    },
    yellow: {
      on: {
        TIMER: { target: 'red' },
      },
    },
    red: {
      on: {
        TIMER: { target: 'green' },
      },
      initial: 'walk',
      states: {
        walk: {
          on: {
            PED_COUNTDOWN: { target: 'wait' },
          },
        },
        wait: {
          on: {
            PED_COUNTDOWN: { target: 'stop' },
          },
        },
        stop: {},
        blinking: {},
      },
    },
  },
  on: {
    POWER_OUTAGE: { target: '.red.blinking' },
    POWER_RESTORED: { target: '.red' },
  },
});

initCommandPalette();

function App() {
  const [state, send] = useMachine(machine, { devTools: true });
  const [lightState] = useMachine(lightMachine, { devTools: true });
  // useMachine(machine, { devTools: true });
  // useMachine(machine, { devTools: true });

  return (
    <div className="App">
      <pre>{JSON.stringify(state.value)}</pre>
      <pre>{JSON.stringify(lightState.value)}</pre>
      <button onClick={() => send('TOGGLE')}>TOGGLE</button>
    </div>
  );
}

export default App;
