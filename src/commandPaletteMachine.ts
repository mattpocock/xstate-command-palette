import produce from 'immer';
import { assign, createMachine, EventObject, Interpreter, State } from 'xstate';
import { XStateDevInterface, getGlobal } from 'xstate/lib/devTools';

export interface CommandPaletteContext {
  services: Record<string, Interpreter<any>>;
  states: Record<string, State<any, any>>;
}

export type CommandPaletteEvent =
  | { type: 'CMD_K_PRESSED' }
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
    };

export const commandPaletteMachine = createMachine<
  CommandPaletteContext,
  CommandPaletteEvent
>({
  initial: 'closed',
  context: {
    services: {},
    states: {},
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
    SERVICE_UNREGISTERED: {
      actions: assign((context, event) => {
        return produce(context, draft => {
          delete draft.services[event.service.sessionId];
          delete draft.states[event.service.sessionId];
        });
      }),
    },
    STATE_CHANGED: {
      actions: assign({
        states: (context, event) => {
          return produce(context.states, draft => {
            draft[event.service.sessionId] = event.state;
          });
        },
      }),
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
        CMD_K_PRESSED: {
          target: 'closed',
        },
        SEND_EVENT_TO_SERVICE: {
          actions: (context, event) => {
            context.services[event.serviceId]?.send(event.event);
          },
        },
      },
    },
  },
});
