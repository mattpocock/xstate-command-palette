import produce from 'immer';
import {
  assign,
  createMachine,
  EventObject,
  Interpreter,
  send,
  State,
} from 'xstate';
import { XStateDevInterface, getGlobal } from 'xstate/lib/devTools';

export interface CommandPaletteContext {
  services: Record<string, Interpreter<any>>;
  states: Record<string, State<any, any>>;
  servicesConsoleLogging: Record<
    string,
    {
      label: string;
    }
  >;
  commandPaletteSearchValue: string;
}

export type CommandPaletteEvent =
  | { type: 'CMD_K_PRESSED' }
  | { type: 'ESC_PRESSED' }
  | {
      type: 'SERVICE_REGISTERED';
      service: Interpreter<any>;
    }
  | {
      type: 'STATE_CHANGED';
      service: Interpreter<any>;
      state: State<any, any>;
    }
  | {
      type: 'SERVICE_UNREGISTERED';
      service: Interpreter<any>;
    }
  | {
      type: 'SEND_EVENT_TO_SERVICE';
      serviceId: string;
      event: EventObject;
    }
  | {
      type: 'CONSOLE_LOG_SERVICE';
      serviceId: string;
      label: string;
    }
  | {
      type: 'REGISTER_SERVICE_TO_CONSOLE_LOG_UPDATES';
      serviceId: string;
      label: string;
    }
  | {
      type: 'UNREGISTER_SERVICE_FROM_CONSOLE_LOG_UPDATES';
      serviceId: string;
    }
  | {
      type: 'CHANGE_COMMAND_PALETTE_FILTER';
      newFilter: string;
    };

export const commandPaletteMachine = createMachine<
  CommandPaletteContext,
  CommandPaletteEvent
>({
  initial: 'closed',
  context: {
    services: {},
    states: {},
    servicesConsoleLogging: {},
    commandPaletteSearchValue: '',
  },
  on: {
    SERVICE_REGISTERED: {
      actions: assign({
        services: (context, event) =>
          produce(context.services, draft => {
            draft[event.service.sessionId] = event.service;
          }),
      }),
    },
    CONSOLE_LOG_SERVICE: {
      actions: (context, event) => {
        consoleLogState(context.states[event.serviceId], event.label);
      },
    },
    SERVICE_UNREGISTERED: {
      actions: assign((context, event) => {
        return produce(context, draft => {
          delete draft.services[event.service.sessionId];
          delete draft.states[event.service.sessionId];
        });
      }),
    },
    STATE_CHANGED: {
      actions: [
        assign({
          states: (context, event) => {
            return produce(context.states, draft => {
              draft[event.service.sessionId] = event.state;
            });
          },
        }),
        context => {
          // Look at all the servicesConsoleLogging in context
          // console.log each of them
          Object.entries(context.servicesConsoleLogging).forEach(
            ([serviceId, { label }]) => {
              consoleLogState(context.states[serviceId], label);
            }
          );
        },
      ],
    },
  },
  invoke: [
    {
      src: () => send => {
        const listener = (e: KeyboardEvent) => {
          if (e.key === 'k' && e.metaKey) {
            e.preventDefault();

            send('CMD_K_PRESSED');
          }
          if (e.key === 'Escape') {
            send('ESC_PRESSED');
          }
        };

        if (typeof window !== 'undefined') {
          window.addEventListener('keydown', listener);
          return () => {
            window.removeEventListener('keydown', listener);
          };
        }
      },
    },
    {
      src: () => send => {
        const global = getGlobal();

        const unlistenerMap: Record<string, () => void> = {};

        const devTools: XStateDevInterface = {
          services: new Set(),
          register: service => {
            send({
              type: 'SERVICE_REGISTERED',
              service,
            });

            const { unsubscribe } = service.subscribe(state => {
              send({
                type: 'STATE_CHANGED',
                service,
                state,
              });
            });

            // Register an unlistener for when this service
            // gets unregistered
            unlistenerMap[service.sessionId] = unsubscribe;
          },
          onRegister: listener => {
            console.log(listener);
            return {
              unsubscribe: () => {},
            };
          },
          unregister: service => {
            send({
              type: 'SERVICE_UNREGISTERED',
              service,
            });
            unlistenerMap[service.sessionId]?.();
            delete unlistenerMap[service.sessionId];
          },
        };

        // @ts-ignore
        global.__xstate__ = devTools;

        return () => {
          Object.values(unlistenerMap).forEach(func => {
            func();
          });
        };
      },
    },
  ],
  states: {
    closed: {
      on: {
        CMD_K_PRESSED: {
          target: 'open',
        },
      },
    },
    open: {
      on: {
        ESC_PRESSED: {
          target: 'closed',
        },
        CHANGE_COMMAND_PALETTE_FILTER: {
          actions: assign((_, event) => {
            return {
              commandPaletteSearchValue: event.newFilter,
            };
          }),
        },
        CMD_K_PRESSED: {
          target: 'closed',
        },
        SEND_EVENT_TO_SERVICE: {
          actions: (context, event) => {
            context.services[event.serviceId]?.send(event.event);
          },
        },
        REGISTER_SERVICE_TO_CONSOLE_LOG_UPDATES: {
          actions: [
            assign({
              servicesConsoleLogging: (context, event) =>
                produce(context.servicesConsoleLogging, draft => {
                  draft[event.serviceId] = {
                    label: event.label,
                  };
                }),
            }),
            () => {
              console.log(`Subscribed!`);
            },
            send<
              CommandPaletteContext,
              Extract<
                CommandPaletteEvent,
                { type: 'REGISTER_SERVICE_TO_CONSOLE_LOG_UPDATES' }
              >,
              CommandPaletteEvent
            >((_, event) => {
              return {
                type: 'CONSOLE_LOG_SERVICE',
                label: event.label,
                serviceId: event.serviceId,
              };
            }),
          ],
        },
        UNREGISTER_SERVICE_FROM_CONSOLE_LOG_UPDATES: {
          actions: [
            () => {
              console.log(`Unsubscribed!`);
            },
            assign({
              servicesConsoleLogging: (context, event) =>
                produce(context.servicesConsoleLogging, draft => {
                  delete draft[event.serviceId];
                }),
            }),
          ],
        },
      },
    },
  },
});

const consoleLogState = (state: State<any, any>, label: string) => {
  console.group(label);
  console.log(`value`, state.value);
  console.log(`context`, state.context);
  console.groupEnd();
};
