declare module 'kaori/dist/sites' {
    export const sites: Record<string, {
        aliases: string[];
        nsfw: boolean;
        endpoint: string;
        random: boolean;
    }>;
}