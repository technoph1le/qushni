import { Hono } from 'hono';
import { findMatches, MatchRequest } from '../match/engine.js';

export const match = new Hono();

// The seeker's quick answers (+ optional note) → the rooms that fit best, each with a reason.
match.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = MatchRequest.safeParse(body ?? {});
  if (!parsed.success) return c.json({ error: 'invalid_request' }, 400);
  return c.json(await findMatches(parsed.data));
});
