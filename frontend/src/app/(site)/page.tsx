import { fetchPublicListings } from '../../data/server';
import { HomePage } from '../../views/HomePage';

// Listings change all the time; render on every request so new rooms show up immediately.
export const dynamic = 'force-dynamic';

export default async function Page() {
  const listings = await fetchPublicListings();
  return <HomePage initialListings={listings} />;
}
