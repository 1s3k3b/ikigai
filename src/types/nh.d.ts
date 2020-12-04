declare module 'nhentai-js' {
    export default class {
        static exists(id: string): Promise<boolean>;
        static getDoujin(id: string): Promise<{
            link: string;
            title: string;
            nativeTitle: string;
            details: {
                tags: string[];
                pages: [string];
                uploaded: [string];
            };
            pages: string[];
        }>;
    }
}