import styled from '@emotion/styled';
import { useInterpret, useSelector } from '@xstate/react';
import React from 'react';
import { commandPaletteMachine } from './commandPaletteMachine';
import {
  getCommandPaletteSearchValue,
  getIsModalOpen,
  getSearchedForCommands,
} from './commandPaletteSelectors';

export const App = () => {
  const service = useInterpret(commandPaletteMachine);
  const isOpen = useSelector(service, getIsModalOpen);

  const availableCommands = useSelector(service, getSearchedForCommands);
  const commandPaletteSearchValue = useSelector(
    service,
    getCommandPaletteSearchValue
  );

  if (isOpen) {
    return (
      <Overlay>
        <CSSVarProvider>
          <ModalBackdrop>
            <Input
              placeholder="Search for command..."
              autoFocus
              value={commandPaletteSearchValue}
              onChange={e =>
                service.send({
                  type: 'CHANGE_COMMAND_PALETTE_FILTER',
                  newFilter: e.target.value,
                })
              }
            ></Input>
            <CommandBox>
              {availableCommands.map(command => {
                return (
                  <div>
                    <FullWidthButton
                      onClick={() => {
                        service.send(command.event);
                      }}
                    >
                      {command.name}
                    </FullWidthButton>
                  </div>
                );
              })}
            </CommandBox>
          </ModalBackdrop>
        </CSSVarProvider>
      </Overlay>
    );
  }
  return null;
};

const CommandBox = styled.div`
  max-height: 20rem;
  overflow-y: scroll;
`;

const Input = styled.input`
  padding: var(--space-4) var(--space-5);
  font-size: var(--text-base);
  border: none;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  background-color: var(--gray-50);
  color: var(--gray-600);
  ::placeholder {
    color: var(--gray-500);
  }
`;

const FullWidthButton = styled.button`
  width: 100%;
  text-align: left;
  background-color: transparent;
  padding: var(--space-3) var(--space-5);
  border: none;
  border-top: 1px solid var(--gray-200);
  font-size: var(--text-sm);
  color: var(--gray-600);
  cursor: pointer;
`;

export const Modal = () => {};

const ModalBackdrop = styled.div`
  background-color: var(--gray-50);
  width: 400px;
`;

const Overlay = styled.div`
  background-color: rgba(0, 0, 0, 0.2);
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  height: 100vh;
  width: 100vw;
  bottom: 0;
  left: 0;
`;

const CSSVarProvider = styled.div`
  --gray-50: #f7fafc;
  --gray-100: #edf2f7;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e0;
  --gray-400: #a0aec0;
  --gray-500: #718096;
  --gray-600: #4a5568;
  --gray-700: #2d3748;
  --gray-800: #1a202c;
  --gray-900: #171923;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-7: 1.75rem;
  --space-8: 2rem;
  --space-9: 2.25rem;
  --space-10: 2.5rem;
  --space-11: 2.75rem;
  --space-12: 3rem;
  --space-14: 3.5rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;
  --space-28: 7rem;
  --space-32: 8rem;
  --space-36: 9rem;
  --space-40: 10rem;
  --space-44: 11rem;
  --space-48: 12rem;
  --space-52: 13rem;
  --space-56: 14rem;
  --space-60: 15rem;
  --space-64: 16rem;
  --space-72: 18rem;
  --space-80: 20rem;
  --space-96: 24rem;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  color: var(--gray-700);

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
`;
