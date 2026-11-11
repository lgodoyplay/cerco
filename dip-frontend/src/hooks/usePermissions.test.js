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
  assert.match(source, /id:\s*'work'|id:\s*"work"/);
  assert.match(source, /id:\s*'investigative'|id:\s*"investigative"/);
  assert.match(source, /id:\s*'legal'|id:\s*"legal"/);
  assert.match(source, /id:\s*'others'|id:\s*"others"/);
});
