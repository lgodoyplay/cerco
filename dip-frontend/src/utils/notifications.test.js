import test from 'node:test';
import assert from 'node:assert/strict';
import { getVisibleNotifications, dedupeNotifications } from './notifications.js';

test('getVisibleNotifications includes global and current-user notifications only', () => {
  const items = [
    { id: '1', user_id: 'user-a', read: false, title: 'Só para A' },
    { id: '2', user_id: null, read: false, title: 'Global' },
    { id: '3', user_id: 'user-b', read: false, title: 'Só para B' },
  ];

  const visible = getVisibleNotifications(items, 'user-a');

  assert.equal(visible.length, 2);
  assert.deepEqual(visible.map(item => item.id), ['1', '2']);
});

test('dedupeNotifications removes repeated entries', () => {
  const items = [
    { id: '1', user_id: 'user-a', title: 'A', message: 'msg' },
    { id: '1', user_id: 'user-a', title: 'A', message: 'msg' },
    { id: '2', user_id: null, title: 'B', message: 'msg2' },
  ];

  const deduped = dedupeNotifications(items);

  assert.equal(deduped.length, 2);
  assert.deepEqual(deduped.map(item => item.id), ['1', '2']);
});
