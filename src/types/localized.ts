/** Shared localized field helpers for admin UI vs data-model drift */
import type { TitleTriplet } from './index';

export type LocalizedField = string | TitleTriplet | undefined;

export function loc(v: LocalizedField, lang: 'en' | 'fr' | 'tah' = 'en'): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return (v[lang] ?? v.en ?? v.fr ?? '') as string;
}
