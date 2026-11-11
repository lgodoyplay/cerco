import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeRoleAssignment, normalizeRoleDisplay } from './roleUtils.js';

const roles = [
  { title: 'Diretor Geral' },
  { title: 'Coordenador' },
  { title: 'Agente' }
];

test('should keep valid existing roles', () => {
  assert.equal(normalizeRoleAssignment('Agente', roles), 'Agente');
  assert.equal(normalizeRoleAssignment('  Coordenador  ', roles), 'Coordenador');
});

test('should clear removed roles', () => {
  assert.equal(normalizeRoleAssignment('Cargo removido', roles), '');
  assert.equal(normalizeRoleAssignment('', roles), '');
  assert.equal(normalizeRoleAssignment(undefined, roles), '');
});

test('should preserve empty display as empty string', () => {
  assert.equal(normalizeRoleDisplay(''), '');
  assert.equal(normalizeRoleDisplay(null), '');
  assert.equal(normalizeRoleDisplay(undefined), '');
  assert.equal(normalizeRoleDisplay('Diretor Geral'), 'Diretor Geral');
});
