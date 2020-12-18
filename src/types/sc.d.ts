declare module 'soundcloud-scraper' {
    export class Client {
        public getSongInfo(s: string): Promise<Song>;
        public getPlaylist(s: string): Promise<Playlist>;
        public getUser(s: string): Promise<User>;
        public search(s: string): Promise<SearchResult[]>;
    }
    export type Song = Record<
        | 'id' | 'title' | 'description' | 'thumbnail'
        | 'url' | 'playCount' | 'likes' | 'genre',
        string
    > & {
        duration: number;
        author: SongAuthor;
        publishedAt: Date;
    };
    export interface SongAuthor {
        name: string;
        username: string;
        url: string;
        avatarURL: string;
        followers: number;
    }
    export interface Playlist {
        title: string;
        url: string;
        description: string;
        thumbnail: string;
        author: {
            profile: string;
            name: string;
        };
        tracks: {
            title: string;
            permalink_url: string;
            user: {
                username: string;
                permalink_url: string;
            };
        }[];
    }
    export interface User {
        name: string;
        profile: string;
        verified: boolean;
        createdAt: Date;
        avatarURL: string;
        followers: number;
        following: number;
        likesCount: number;
        tracksCount: number;
        tracks: {
            title: string;
            url: string;
            publishedAt: Date;
            genre: string;
            duration: number;
        }[];
    }
    export interface SearchResult {
        artist?: string;
        url: string;
        name: string;
        type: 'track' | 'artist' | 'playlist' | 'unknown';
    }
}