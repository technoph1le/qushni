// In production the API (../backend) runs here, inside the site's own Vercel project.
// Locally, API_URL points at the separate backend process and next.config.ts proxies /api/* to it
// before this route is reached.
import { api } from '../../../../../backend/src/app';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handle = (req: Request) => api.fetch(req);

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE, handle as OPTIONS };
