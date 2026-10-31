import type { TKey } from '../../i18n';
import type { Listing, LocalizedText } from '../../types';

/** Hosts don't have to write a title; then the room type stands in ("Alohida xona"). */
export function listingTitle(l: Pick<Listing, 'title' | 'roomType'>, lt: (v: LocalizedText) => string, t: (k: TKey) => string) {
  return lt(l.title).trim() || t(`room.${l.roomType}`);
}
