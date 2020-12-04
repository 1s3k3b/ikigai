import fetch from 'node-fetch';
import { findBestMatch } from 'string-similarity';
import { JikanAnime, JikanAnimeList, JikanCharacters, JikanMangaList, JikanSearch, JikanSeason, JikanUser, SearchJikanAnime, SearchJikanManga } from '../types';
import constants from '../util/constants';

const seasons = ['winter', 'spring', 'summer', 'fall', 'winter'];

export default class {
    public animeCache = new Map<string, JikanAnime>();
    public animeCharCache = new Map<string, JikanCharacters>();
    public seasonCache = new Map<string, JikanSeason>();
    private request<T>(...u: any[]): Promise<T> {
        return fetch(u.join(''))
            .then(d => d.json())
            .then(d => {
                if (d.status !== 400) return d;
                throw new Error(d.message);
            });
    }
    public async fetchAnime(id: string | number) {
        return this.animeCache.get(`${id}`) || this
            .request<JikanAnime>(constants.REST.JIKAN.ANIME, id)
            .then(d => {
                this.animeCache.set(`${id}`, d);
                return d;
            });
    }
    public async fetchAnimeCharacters(id: string | number) {
        return this.animeCharCache.get(`${id}`) || this
            .request<JikanCharacters>(constants.REST.JIKAN.ANIME, id, '/characters_staff')
            .then(d => {
                this.animeCharCache.set(`${id}`, d);
                return d;
            });
    }
    public async fetchSeason(year = new Date().getFullYear(), season: number | string = new Date().getMonth()): Promise<[number, string, JikanSeason]> {
        const rSeason = typeof season === 'string' ? season : seasons[~~(season / 3)];
        const key = `${year},${rSeason}`;
        return [year, rSeason, this.seasonCache.get(key) || await this
            .request<JikanSeason>(
                constants.REST.JIKAN.SEASON,
                year,
                '/',
                rSeason,
            ).then(d => {
                this.seasonCache.set(key, d);
                return d;
            })];
    }
    public search<T extends 'anime' | 'manga'>(t: T, page: number, q: string, data: {
        genre?: string;
        rated?: string;
    } = {}) {
        let query = `?page=${page}&q=${encodeURIComponent(q)}`;
        if (data.genre) query += `&genre=${constants.JIKAN.GENRES[findBestMatch(data.genre, Object.keys(constants.JIKAN.GENRES)).bestMatch.target]}`;
        if (data.rated) query += `&rated=${findBestMatch(data.rated, constants.JIKAN.RATINGS).bestMatch.target}`;
        return this.request<JikanSearch<'anime' extends T ? SearchJikanAnime : SearchJikanManga>>(constants.REST.JIKAN.SEARCH, t, query);
    }
    public fetchUser(name: string) {
        return this.request<JikanUser>(constants.REST.JIKAN.USER, name);
    }
    public fetchUserAnime(name: string) {
        return this.request<JikanAnimeList>(constants.REST.JIKAN.USER, name, '/animelist');
    }
    public fetchUserManga(name: string) {
        return this.request<JikanMangaList>(constants.REST.JIKAN.USER, name, '/mangalist');
    }
}