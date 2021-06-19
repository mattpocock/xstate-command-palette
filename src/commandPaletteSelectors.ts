import {
  CommandPaletteEvent,
  commandPaletteMachine,
} from 'commandPaletteMachine';
import { StateFrom } from 'xstate';

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

  const eventSenders: Command[] = latestStateShapes.flatMap(
    ([serviceId, stateShape]) => {
      return stateShape.nextEvents.map(event => {
        return {
          name: `Send ${event} to ${state.context.services[serviceId].id}`,
          event: {
            type: 'SEND_EVENT_TO_SERVICE',
            serviceId,
            event: {
              type: event,
            },
          },
        };
      });
    }
  );

  const consoleLogs: Command[] = latestStateShapes.map(([serviceId]) => {
    return {
      name: `console.log ${state.context.services[serviceId].id} state`,
      event: {
        type: 'CONSOLE_LOG_SERVICE',
        serviceId,
        label: `${state.context.services[serviceId].id} state`,
      },
    };
  });

  return eventSenders.concat(consoleLogs);
};
