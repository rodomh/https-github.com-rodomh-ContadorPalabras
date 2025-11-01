export type Language = 'es-ES' | 'en-US' | 'ar-SA' | 'ur-PK';

export interface SupportedLanguage {
    code: Language;
    name: string;
}

export interface Phrase {
    text: string;
    count: number;
}
