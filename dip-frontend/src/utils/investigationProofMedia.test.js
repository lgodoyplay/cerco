import test from 'node:test';
import assert from 'node:assert/strict';
import { getInvestigationVideoMedia } from './investigationProofMedia.js';

test('converte links de YouTube para embed compatível com player', () => {
  const media = getInvestigationVideoMedia('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=31s');
  assert.equal(media.embedUrl, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=31');
});
