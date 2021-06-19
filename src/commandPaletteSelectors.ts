import {
  CommandPaletteEvent,
  commandPaletteMachine,
} from 'commandPaletteMachine';
import { State, StateFrom } from 'xstate';

type CommandPaletteState = StateFrom<typeof commandPaletteMachine>;

export const getIsModalOpen = (state: CommandPaletteState) => {
  return state.matches('open');
};

interface Command {
  name: string;
  event: CommandPaletteEvent;
}

export const getAvailableCommands = (state: CommandPaletteState): Command[] => {
  const latestStateShapes = Object.entries(state.context.states);

  return latestStateShapes.flatMap(([serviceId, stateShape]) => {
    return stateShape.nextEvents.map(event => {
      return {
        name: `Send ${event}`,
        event: {
          type: 'SEND_EVENT_TO_SERVICE',
          serviceId,
          event: {
            type: event,
          },
        },
      };
    });
  });
};
