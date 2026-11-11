import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDefaultCorporation,
  normalizeCorporationList,
  getUserStructureAssignments,
  applyCorporationAssignment,
} from './corporationUtils.js';

test('buildDefaultCorporation returns default department, division and sector collections', () => {
  const corporation = buildDefaultCorporation();

  assert.ok(Array.isArray(corporation.departments));
  assert.ok(Array.isArray(corporation.divisions));
  assert.ok(Array.isArray(corporation.sectors));
  assert.ok(corporation.departments.length > 0);
  assert.ok(corporation.divisions.length > 0);
  assert.ok(corporation.sectors.length > 0);
});

test('normalizeCorporationList converts legacy string arrays into structured items', () => {
  const list = ['Narcóticos', 'Homicídios'];
  const normalized = normalizeCorporationList(list);

  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].name, 'Narcóticos');
  assert.equal(typeof normalized[0].id, 'string');
  assert.deepEqual(normalized[0].members, []);
  assert.equal(normalized[0].chiefId, '');
});

test('applyCorporationAssignment allows assigning members before defining the chief', () => {
  const firstAssignment = applyCorporationAssignment({ chiefId: '', members: [] }, 'u-2', 'member');
  assert.equal(firstAssignment.chiefId, '');
  assert.deepEqual(firstAssignment.members, ['u-2']);

  const secondAssignment = applyCorporationAssignment(firstAssignment, 'u-1', 'chief');
  assert.equal(secondAssignment.chiefId, 'u-1');
  assert.deepEqual(secondAssignment.members, ['u-2']);

  const toggledMember = applyCorporationAssignment(secondAssignment, 'u-2', 'member');
  assert.equal(toggledMember.chiefId, 'u-1');
  assert.deepEqual(toggledMember.members, []);
});

test('getUserStructureAssignments returns all units that include the user as chief or member', () => {
  const corporation = {
    departments: [
      { id: 'dep-1', name: 'Departamento de Investigações', chiefId: 'u-1', members: ['u-2'] },
    ],
    divisions: [
      { id: 'div-1', name: 'Narcóticos', chiefId: 'u-2', members: ['u-1'] },
    ],
    sectors: [
      { id: 'set-1', name: 'Operacional', chiefId: 'u-3', members: ['u-1'] },
    ],
  };

  const assignments = getUserStructureAssignments(corporation, 'u-1');

  assert.equal(assignments.length, 3);
  assert.deepEqual(
    assignments.map((assignment) => assignment.name).sort(),
    ['Departamento de Investigações', 'Narcóticos', 'Operacional'].sort()
  );
  assert.ok(assignments.some((assignment) => assignment.type === 'departments'));
  assert.ok(assignments.some((assignment) => assignment.role === 'chefe'));
});
