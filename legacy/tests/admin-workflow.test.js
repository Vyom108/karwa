import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKING_TRANSITIONS, REVIEW_TRANSITIONS } from '../js/admin-workflow.js';

test('booking status flow allows only pending to confirmed/cancelled and confirmed to completed/cancelled', () => {
  assert.deepEqual(BOOKING_TRANSITIONS.pending, ['confirmed', 'cancelled']);
  assert.deepEqual(BOOKING_TRANSITIONS.confirmed, ['completed', 'cancelled']);
  assert.deepEqual(BOOKING_TRANSITIONS.completed, []);
  assert.deepEqual(BOOKING_TRANSITIONS.cancelled, []);
});

test('review decisions can only be made from pending', () => {
  assert.deepEqual(REVIEW_TRANSITIONS.pending, ['approved', 'rejected']);
  assert.deepEqual(REVIEW_TRANSITIONS.approved, []);
  assert.deepEqual(REVIEW_TRANSITIONS.rejected, []);
});
