import assert from 'node:assert/strict';
import { it } from 'node:test';
import { normalizePhone } from './phone';

it('accepts Uzbek numbers in common formats', () => {
  assert.equal(normalizePhone('+998 90 123 45 67'), '+998901234567');
  assert.equal(normalizePhone('998901234567'), '+998901234567');
  assert.equal(normalizePhone('90 123-45-67'), '+998901234567');
});

it('rejects foreign and malformed numbers', () => {
  assert.equal(normalizePhone('+7 912 345 67 89'), null);
  assert.equal(normalizePhone('+1 415 555 0100'), null);
  assert.equal(normalizePhone('+998 90 123 45'), null);
  assert.equal(normalizePhone('+998 90 123 45 678'), null);
  assert.equal(normalizePhone(''), null);
});
