// #region help

export interface CommandHelp {
    type: 2;
    desc: string;
    category: string;
    nsfw?: boolean;
    readme?: number;
    args?: Record<string, string>;
    flags?: Record<string, string>;
    prefix?: string;
    examples?: string[];
}

export interface Subcommand {
    name: string;
    aliases?: string[];
    desc: string;
    nsfw?: boolean;
    readme?: number;
    args?: Record<string, string>;
    flags?: Record<string, string>;
    examples?: string[];
}

export type Help =
    | {
        type: 0;
        unlisted: true;
    }
    | {
        type: 1;
        name: string;
        case: string;
        emoji: string;
        desc: string;
        priority: number;
        subcommands: Subcommand[];
    }
    | CommandHelp;

// #endregion help

// #region other

export interface OsuUser {
    username: string;
    avatar_url: string;
    id: number;
    statistics: {
        rank: {
            global?: number;
            country?: number;
        };
        level: {
            current: number;
            progress: number;
        };
        pp: number;
        pp_rank: number;
        ranked_score: number;
        hit_accuracy: number;
        play_count: number;
        total_score: number;
        total_hits: number;
        maximum_combo: number;
    };
    join_date: number;
    last_visit: number;
    country_code: string;
    playmode: string;
    playstyle?: string[];
    interests: string;
    website: string;
    discord: string;
    skype: string;
    twitter: string;
}

export interface UDResult {
    list: {
        definition: string;
        permalink: string;
        thumbs_up: number;
        sound_urls: string[];
        author: string;
        word: string;
        defid: number;
        current_vote: string;
        written_on: number;
        example: string;
        thumbs_down: number;
    }[];
}

export interface RedditPost {
    title: string;
    ups: number;
    upvote_ratio: number;
    permalink: string;
    url: string;
    over_18: boolean;
    post_hint: string;
}

export interface RedditResponse {
    data: {
        children: { data: RedditPost }[];
    }
}

export interface JishoWord {
    slug: string;
    senses: {
        parts_of_speech: string[];
        english_definitions: string[];
    }[];
    japanese: {
        word?: string;
        reading: string;
    }[];
}

export interface WhatAnimeResponse {
    docs:
        (
            Record<'from' | 'to' | 'at' | 'episode' | 'anilist_id' | 'mal_id' | 'similarity', number>
            & Record<'filename' | 'tokenthumb', string>
            & { is_adult: boolean }
        )[];
}

export interface YouTubeSearchVideo {
    videoId: string;
    thumbnail: {
        thumbnails: {
            url: string;
            width: number;
            height: number;
        }[];
    };
    title: {
        runs: { text: string; }[];
    };
    descriptionSnippet?: {
        runs: { text: string; }[];
    };
    ownerText: {
        runs: {
            text: string;
            navigationEndpoint: {
                browseEndpoint: { canonicalBaseUrl: string; };
            };
        }[];
    };
    publishedTimeText?: { simpleText: string; };
    viewCountText?: { simpleText: string; };
}

export interface DBLBot {
    owner_id: string;
    short_description: string;
    long_description: string;
    prefix: string;
    website: string;
    oauth_url: string;
    server_invite: string;
    tags: string[];
    profile: {
        username: string;
        avatar: string;
        discriminator: string;
        flags: number;
    };
    slug: string;
    created_at: number;
    updated_at: number;
    upvotes: number;
    rating: number;
    ratings: number;
    id: string;
}

// #endregion other

// #region jikan

export type JikanAnimeType = 'tv' | 'ova' | 'movie' | 'special' | 'ona' | 'music';

export type JikanMangaType = 'manga' | 'novel' | 'oneshot' | 'doujin' | 'manhwa' | 'manhua';

export interface SearchJikanAnime {
    mal_id: number;
    url: string;
    image_url: string;
    title: string;
    synopsis: string;
    episodes: number;
    score: number;
    start_date: string;
    end_date: string;
    rated: string;
}

export interface SearchJikanManga {
    mal_id: number;
    url: string;
    image_url: string;
    title: string;
    synopsis: string;
    chapters: number;
    volumes: number;
    score: number;
    start_date?: string;
    end_date?: number;
}

export interface SeasonJikanAnime {
    mal_id: number;
    url: string;
    title: string;
    image_url: string;
    synopsis: string;
    airing_start: string;
    episodes: number;
    genres: { name: string; url: string; }[];
    score: number;
}

export interface JikanAnime {
    mal_id: number;
    url: string;
    image_url: string;
    trailer_url: string;
    title: string;
    title_english: string;
    title_japanese: string;
    episodes: number;
    status: string;
    airing: boolean;
    aired: { string: string; };
    duration: string;
    rating: string;
    score: number;
    rank: number;
    favorites: number;
    synopsis: string;
    genres: { name: string; url: string; }[];
}

export interface JikanCharacter {
    mal_id: number;
    url: string;
    image_url: string;
    name: string;
    role: string;
    voice_actors: {
        mal_id: number;
        name: string;
        url: string;
        image_url: string;
        language: string;
    }[];
}

interface JikanStructBase {
    mal_id: number;
    url: string;
    image_url: string;
    name: string;
}

export interface JikanUser {
    user_id: 357148;
    username: string;
    url: string;
    image_url: string;
    last_online: string;
    gender?: string;
    birthday?: string;
    location?: string;
    joined: string;
    anime_stats: Record<'days_watched' | 'mean_score' | 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch' | 'total_entries' | 'rewatched' | 'episodes_watched', number>;
    manga_stats: Record<'days_read' | 'mean_score' | 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read' | 'total_enntries' | 'reread' | 'chapters_read' | 'volumes_read', number>;
    favorites: Record<'anime' | 'manga' | 'people' | 'characters', JikanStructBase[]>;
    about?: string;
}

export interface JikanSearch<T> {
    results: T[];
    last_page: number;
}

export interface JikanCharacters {
    characters: JikanCharacter[];
}

export interface JikanSeason {
    anime: SeasonJikanAnime[];
}

export interface JikanAnimeList {
    anime: {
        mal_id: number;
        title: string;
        url: string;
        watching_status: number;
        score: number;
        watched_episodes: number;
        total_episodes: number;
        airing_status: number;
        rating: string;
    }[];
}

export interface JikanMangaList {
    manga: {
        mal_id: number;
        title: string;
        url: string;
        type: string;
        reading_status: number;
        score: number;
        read_chapters: number;
        read_volumes: number;
        total_chapters: number;
        total_volumes: number;
    }[];
}

// #endregion jikan

// #region spotify

export interface SpotifyPlaylist {
    description: string;
    external_urls: { spotify: string };
    followers: { total: number };
    images: { url: string }[];
    name: string;
    owner: {
        display_name: string;
        external_urls: { spotify: string };
    };
    tracks: {
        items: {
            added_at: string;
            track: {
                album: {
                    external_urls: { spotify: string };
                    name: string;
                };
                artists: {
                    external_urls: { spotify: string };
                    name: string;
                }[];
                duration_ms: number;
                external_urls: { spotify: string };
                name: string;
            };
        }[];
    };
}

export interface SpotifyTrack {
    name: string;
    duration_ms: number;
    external_urls: {
        spotify: string;
    };
    artists: {
        name: string;
        external_urls: {
            spotify: string;
        };
    }[];
    album: {
        name: string;
        release_date: string;
        total_tracks: number;
        external_urls: {
            spotify: string;
        };
        artists: {
            name: string;
            external_urls: {
                spotify: string;
            };
        }[];
    }
}

// #endregion spotify

// #region waifulist

export interface WaifuSearch {
    name: string;
    id: number;
    original_name: string;
    romaji: string;
    romaji_name: string;
    display_picture: string;
    description: string;
    likes: number;
    trash: number;
    type: string;
    appearances: {
        name: string;
        type: string;
        original_name: string;
        url: string;
    }[];
    url: string;
    entity_type: string;
}

export interface Waifu {
    data: {
        id: number;
        name: string;
        original_name: string;
        romaji_name: string;
        display_picture: string;
        description: string;
        weight?: number;
        height?: string;
        bust?: number;
        hip?: number;
        waist?: number,
        age: number;
        birthday_month: string;
        birthday_day: number;
        birthday_year: string;
        likes: number;
        trash: number;
        popularity_rank: number;
        like_rank: number;
        trash_rank: number;
        husbando: boolean;
        nsfw: boolean;
        creator: { name: string; };
        url: string;
        appearances: WaifuAnime[];
        series: WaifuAnime;
    };
}

export interface WaifuGallery {
    data: {
        path: string;
        created_at: string;
        updated_at: string;
        thumbnail: string;
        nsfw: 0 | 1;
    }[];
}

interface WaifuAnime {
    name: string;
    original_name: string;
    description: string;
    slug: string;
    episode_count: number;
    display_picture: string;
}

// #endregion waifulist

// #region nhentai

export interface NhentaiSearch {
    id: string;
    img: string;
    name: string;
}

export interface NhentaiListing {
    name: string;
    count: number;
    href: string;
    fetch: () => Promise<NhentaiSearch[]>;
}

// #endregion nhentai

// #region github

export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    owner: { avatar_url: string };
    html_url: string;
    description: string;
    fork: boolean;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    svn_url: string;
    homepage?: string;
    size: number;
    stargazers_count: number;
    watchers_count: number;
    language: string;
    forks_count: number;
    archived: boolean;
    disabled: boolean;
    open_issues_count: number;
    license?: Record<'name' | 'url', string>;
    forks: number;
    open_issues: number;
    watchers: number;
    default_branch: string;
    network_count: number;
    subscribers_count: number;
}

export interface GitHubUser {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
    site_admin: boolean;
    name?: string;
    company?: string;
    blog?: string;
    location?: string;
    email?: string;
    bio: string;
    twitter_username?: string;
    public_repos: number;
    public_gists: number;
    followers: number;
    following: number;
    created_at: string;
    updated_at: string;
}

// #endregion github

// #region topgg

export interface TopGGSearch {
    results: Record<'id' | 'name' | 'avatar', string>[];
}

export interface TopGGBot {
    invite: string;
    website: string;
    support: string;
    github: string;
    shortdesc: string;
    prefix: string;
    clientid: string;
    id: string;
    date: string;
    guilds: any[];
    shards: any[];
    monthlyPoints: number;
    points: number;
    owners: string[];
    tags: string[];
}

// #endregion topgg