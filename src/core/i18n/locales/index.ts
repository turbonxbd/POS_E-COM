import { SupportedLocale, TranslationDictionary } from '../../../types/i18n.types';
import en from './en';
import bn from './bn';

/**
 * Registry of available static dictionaries by locale.
 */
export const dictionaries: Record<SupportedLocale, TranslationDictionary> = {
  en,
  bn,
};

export { en, bn };
