declare module 'phonetic-english' {
    export class Translator {
        constructor(type: string[]);
        public translate(str: string): string;
        static spelling: Record<string, string[]>;
    }
}