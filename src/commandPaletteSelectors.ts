import {
  CommandPaletteEvent,
  commandPaletteMachine,
} from 'commandPaletteMachine';
import { StateFrom } from 'xstate';

type CommandPaletteState = StateFrom<typeof commandPaletteMachine>;

export const getIsModalOpen = (state: CommandPaletteState) => {
  return state.matches('open');
};

export const getServiceIdsIAmSubscribedTo = (state: CommandPaletteState) => {
  return Object.keys(state.context.servicesConsoleLogging);
};

export const getCommandPaletteSearchValue = (state: CommandPaletteState) => {
  return state.context.commandPaletteSearchValue;
};

interface Command {
  name: string;
  event: CommandPaletteEvent;
}

export const getAvailableCommands = (state: CommandPaletteState): Command[] => {
  const latestStateShapes = Object.entries(state.context.states);
  const serviceIdsSubscribedToConsoleLogs = getServiceIdsIAmSubscribedTo(state);

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

  const consoleLogs: Command[] = latestStateShapes.flatMap(([serviceId]) => {
    const machineId = state.context.services[serviceId].id;
    const commands: Command[] = [
      {
        name: `console.log ${machineId} state`,
        event: {
          type: 'CONSOLE_LOG_SERVICE',
          serviceId,
          label: `${machineId} state`,
        },
      },
    ];

    if (serviceIdsSubscribedToConsoleLogs.includes(serviceId)) {
      commands.push({
        name: `Unsubscribe from ${machineId} state updates`,
        event: {
          type: 'UNREGISTER_SERVICE_FROM_CONSOLE_LOG_UPDATES',
          serviceId,
        },
      });
    } else {
      commands.push({
        name: `Subscribe to ${machineId} state updates`,
        event: {
          type: 'REGISTER_SERVICE_TO_CONSOLE_LOG_UPDATES',
          serviceId,
          label: `${machineId} state`,
        },
      });
    }

    return commands;
  });

  return eventSenders.concat(consoleLogs);
};
