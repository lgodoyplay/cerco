import test from 'node:test';
import assert from 'node:assert/strict';
import { getBoTypeConfig } from './boHelpers.js';

test('returns citizen BO config', () => {
  const config = getBoTypeConfig('cidadao');
  assert.equal(config.label, 'BO Cidadão');
  assert.equal(config.primaryLabel, 'Comunicante');
  assert.equal(config.secondaryLabel, 'Pessoa Denunciada');
});

test('returns police BO config', () => {
  const config = getBoTypeConfig('policial');
  assert.equal(config.label, 'BO Policial');
  assert.equal(config.primaryLabel, 'Vítima');
  assert.equal(config.secondaryLabel, 'Culpado / Suspeito');
});
