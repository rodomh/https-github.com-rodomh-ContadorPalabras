import { SupportedLanguage, Phrase } from './types';

export const PHRASES_STORAGE_KEY = 'voiceCounterPhrases';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
    { code: 'es-ES', name: 'Español (España)' },
    { code: 'en-US', name: 'English (US)' },
    { code: 'ar-SA', name: 'العربية (السعودية)' },
    { code: 'ur-PK', name: 'اردو (پاکستان)' }
];

export const DEFAULT_PHRASES: Phrase[] = [
    { text: 'subhanallah', count: 0 },
    { text: 'alhamdulillah', count: 0 },
    { text: 'allahu akbar', count: 0 },
    { text: 'la ilaha illallah', count: 0 },
];
