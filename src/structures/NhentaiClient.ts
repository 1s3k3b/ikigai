import fetch from 'node-fetch';
import nh from 'nhentai-js';
import $ from 'cheerio';
import constants from '../util/constants';
import { NhentaiListing, NhentaiSearch } from '../types';

export default class NhentaiClient {
    public pageCount = {
        tags: 0,
        artists: 0,
        characters: 0,
        parodies: 0,
        groups: 0,
    };
    public sauce = new Map<string, Doujin>();
    public searches = new Map<string, NhentaiSearch[]>();
    public tagCache = new Map<number, NhentaiListing[]>();
    public artistCache = new Map<number, NhentaiListing[]>();
    public characterCache = new Map<number, NhentaiListing[]>();
    public parodyCache = new Map<number, NhentaiListing[]>();
    public groupCache = new Map<number, NhentaiListing[]>();
    public tags!: (p?: number) => Promise<NhentaiListing[]>;
    public allTags!: () => Promise<NhentaiListing[]>;
    public artists!: (p?: number) => Promise<NhentaiListing[]>;
    public allArtists!: () => Promise<NhentaiListing[]>;
    public characters!: (p?: number) => Promise<NhentaiListing[]>;
    public allCharacters!: () => Promise<NhentaiListing[]>;
    public parodies!: (p?: number) => Promise<NhentaiListing[]>;
    public allParodies!: () => Promise<NhentaiListing[]>;
    public groups!: (p?: number) => Promise<NhentaiListing[]>;
    public allGroups!: () => Promise<NhentaiListing[]>;
    constructor() {
        for (
            const [name, all, cache, path] of
            <const>[
                ['tags', 'allTags', 'tagCache', constants.REST.NHENTAI.TAGS],
                ['artists', 'allArtists', 'artistCache', constants.REST.NHENTAI.ARTISTS],
                ['characters', 'allCharacters', 'characterCache', constants.REST.NHENTAI.CHARACTERS],
                ['parodies', 'allParodies', 'parodyCache', constants.REST.NHENTAI.PARODIES],
                ['groups', 'allGroups', 'groupCache', constants.REST.NHENTAI.GROUPS],
            ]
        ) {
            Object.defineProperties(this, {
                [name]: {
                    value: async (p = 1) => {
                        return this[cache].get(p) || this
                            .request(`${path}${p}`)
                            .then(d => this.listing(d))
                            .then(d => this[cache].set(p, d) && d);
                    },
                },
                [all]: {
                    value: async () => {
                        const pages = this.pageCount[name] || await this
                            .request(`${path}1`)
                            .then(s => +$('a.last', s)[0].attribs.href.match(/\d+/)![0])
                            .then(n => this.pageCount[name] = n);
                        const results = [];
                        for (let p = 1; p <= pages; p++) results.push(...await this[name](p));
                        return results.filter(x => !x.href.startsWith(`/${name}/`));
                    },
                },
            });
        }
    }
    private async request(s: string) {
        return fetch(s).then(d => d.text());
    }
    private async doujins(d: string) {
        return $('div.gallery > a', d)
            .toArray()
            .map(x => ({
                id: x.attribs.href.match(/\d+/)![0],
                img: x.children[0].attribs['data-src'],
                name: $(x.children[2]).text(),
            }));
    }
    public async listing(d: string) {
        return $('section > a', d)
            .toArray()
            .map(a => ({
                name: $(a.children[0]).text(),
                count: +$(a.children[1]).text()
                    .replace('K', '000'),
                href: a.attribs.href,
                fetch: () => this
                    .request(`${constants.REST.NHENTAI.BASE}${a.attribs.href}`)
                    .then(this.doujins),
            }));
    }
    public async doujin(id: string) {
        return this.sauce.get(id)
            || nh
                .getDoujin(id)
                .then(d => this.sauce.set(id, d) && d);
    }
    public async homepage() {
        return this
            .request(constants.REST.NHENTAI.BASE)
            .then(this.doujins);
    }
    public random() {
        return this
            .request(constants.REST.NHENTAI.RANDOM)
            .then(d => `${
                JSON.parse(
                    d
                        .match(/JSON\.parse\("(.+)"\)/)![1]
                        .replace(/\\u\d+\w/g, x => eval(`'${x}'`))
                ).id
            }`);
    }
    public async search(s: string) {
        s = encodeURIComponent(s.trim().toLowerCase());
        return this.searches.get(s) || this
            .request(`${constants.REST.NHENTAI.SEARCH}${s}`)
            .then(this.doujins)
            .then(d => this.searches.set(s, d) && d);
    }
}

type Doujin = ReturnType<typeof nh['getDoujin']> extends Promise<infer T> ? T : void;