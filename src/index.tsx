import * as React from 'react';
import { render } from 'react-dom';
import { App } from './App';

export const initCommandPalette = (params?: {
  getRootElement?: () => HTMLElement;
}) => {
  let element: HTMLElement;
  if (params?.getRootElement) {
    element = params?.getRootElement();
  } else {
    const existingElement = document.querySelector(
      'div[data-xstate-command-palette]'
    ) as HTMLElement | null;

    if (existingElement) {
      element = existingElement;
    } else {
      element = document.createElement('div');
      element.setAttribute('data-xstate-command-palette', 'true');
    }

    document.body.appendChild(element);
  }

  render(<App></App>, element);
};
