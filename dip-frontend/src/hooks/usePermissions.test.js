import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const filePath = path.resolve(process.cwd(), 'src/hooks/usePermissions.js');

test('permissions include alvaras and corregedoria categories', async () => {
  const source = await fs.readFile(filePath, 'utf8');

  assert.match(source, /ALVARAS_VIEW/);
  assert.match(source, /CORREGEDORIA_VIEW/);
  assert.match(source, /id:\s*'judiciary'|id:\s*"judiciary"/);
  assert.match(source, /id:\s*'others'|id:\s*"others"/);
});
