import { ListingFormPage } from '../../../../views/dashboard/ListingFormPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingFormPage key={id} id={id} />;
}
