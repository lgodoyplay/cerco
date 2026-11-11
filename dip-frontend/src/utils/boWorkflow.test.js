import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultWorkflow } from './boInvestigationWorkflow.js';

test('uses a concise BO investigation flow without redundant stages', () => {
  const workflow = createDefaultWorkflow(99, { descricao: 'Teste de fluxo' });

  assert.deepEqual(
    workflow.steps.map((step) => step.title),
    [
      'Abertura da pasta e identificação inicial',
      'Cenário e perícia',
      'Testemunhas',
      'Diligências',
      'Investigados',
      'Encerramento e conclusão final'
    ]
  );
});
