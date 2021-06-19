import styled from '@emotion/styled';
import { useInterpret, useSelector } from '@xstate/react';
import React from 'react';
import { commandPaletteMachine } from './commandPaletteMachine';
import {
  getAvailableCommands,
  getIsModalOpen,
} from './commandPaletteSelectors';

export const App = () => {
  const service = useInterpret(commandPaletteMachine);
  const isOpen = useSelector(service, getIsModalOpen);

  const availableCommands = useSelector(service, getAvailableCommands);

  if (isOpen) {
    return (
      <Overlay>
        <ModalBackdrop>
          <p>Hello</p>
          {availableCommands.map(command => {
            return (
              <div>
                <button
                  onClick={() => {
                    service.send(command.event);
                  }}
                >
                  {command.name}
                </button>
              </div>
            );
          })}
        </ModalBackdrop>
      </Overlay>
    );
  }
  return null;
};

export const Modal = () => {};

const ModalBackdrop = styled.div`
  background-color: white;
  padding: 1rem;
  border-radius: 0.4rem;
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
