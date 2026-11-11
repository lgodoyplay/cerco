import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { SettingsProvider } from './SettingsContext.jsx';

test('SettingsProvider can render without triggering fetchUsers initialization order errors', () => {
  assert.doesNotThrow(() => {
    const element = React.createElement(
      SettingsProvider,
      null,
      React.createElement('div', null, 'ok')
    );

    ReactDOMServer.renderToString(element);
  });
});
