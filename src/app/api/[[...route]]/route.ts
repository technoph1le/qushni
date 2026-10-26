import { handle } from 'hono/vercel';
import { api } from '../../../server/app';

// Node runtime: the payment and login code uses node:crypto.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handle(api);
export const POST = handle(api);
