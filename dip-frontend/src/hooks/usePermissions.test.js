import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const filePath = path.resolve(process.cwd(), 'src/hooks/usePermissions.js');

test('permissions include the individual dashboard menu categories requested by the user', async () => {
  const source = await fs.readFile(filePath, 'utf8');

  assert.match(source, /DASHBOARD_VIEW/);
  assert.match(source, /ANP_STUDENT_VIEW|STUDENT_VIEW/);
  assert.match(source, /PROTECTIVE_MEASURES_VIEW/);
  assert.match(source, /BO_INTERNO_VIEW/);
  assert.match(source, /SEARCH_SEIZURE_VIEW/);
  assert.match(source, /COMMUNICATION_VIEW/);
  assert.match(source, /ALVARAS_VIEW/);
  assert.match(source, /CORREGEDORIA_VIEW/);
  assert.match(source, /id:\s*'dashboard'|id:\s*"dashboard"/);
  assert.match(source, /id:\s*'bo'|id:\s*"bo"/);
  assert.match(source, /id:\s*'operations'|id:\s*"operations"/);
  assert.match(source, /id:\s*'investigative'|id:\s*"investigative"/);
  assert.match(source, /id:\s*'legal'|id:\s*"legal"/);
  assert.match(source, /id:\s*'communication'|id:\s*"communication"/);
  assert.match(source, /id:\s*'settings'|id:\s*"settings"/);
});

test('permission groups are unique and each module exposes only one clear view/manage pair', async () => {
  const source = await fs.readFile(filePath, 'utf8');

  const matches = [...source.matchAll(/id:\s*PERMISSIONS\.[A-Z_]+/g)].map((match) => match[0]);
  const uniqueIds = new Set(matches);

  assert.equal(uniqueIds.size, matches.length, 'Each permission key should be declared once and not repeated in several groups');
  assert.match(source, /Boletins: visualizar \/ pesquisar/i);
  assert.match(source, /Prisões: visualizar \/ pesquisar/i);
  assert.match(source, /Procurados: visualizar \/ pesquisar/i);
  assert.match(source, /Investigações: visualizar \/ pesquisar/i);
  assert.match(source, /Alvarás: visualizar \/ pesquisar/i);
  assert.match(source, /Configurações: visualizar \/ pesquisar/i);
  assert.match(source, /Registrar \/ Gerenciar|Registrar \/ gerenciar/i);
});

test('role matching tolerates spacing and punctuation without falling back to legacy access', async () => {
  const source = await fs.readFile(filePath, 'utf8');

  assert.match(source, /findMatchingRoleConfig/);
  assert.match(source, /normalize\('NFD'\)/);
  assert.match(source, /replace\(\/\[\^a-z0-9\\s\]\//);
  assert.match(source, /replace\(\/\\s\+\/g, ' '\)/);
});
