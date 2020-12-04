import fetch from 'node-fetch';
import { Waifu, WaifuGallery, WaifuSearch } from '../types';
import constants from '../util/constants';
import $ from 'cheerio';

export default class {
    public waifus = new Map<string, Waifu>();
    public galleries = new Map<string, WaifuGallery>();
    private async headers() {
        const res = await fetch(constants.REST.WAIFULIST.TOKEN);
        const headers = res.headers.raw();
        const xsrf = headers['set-cookie'][1].match(/XSRF-TOKEN=(.+?);/)![1];
        return {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json;charset=UTF-8',
            'X-CSRF-Token': $('#_token', await res.text())[0].attribs.content,
            'X-XSRF-Token': decodeURIComponent(xsrf),
            cookie: `XSRF-TOKEN=${xsrf}; mywaifulist_session=${headers['set-cookie'][2].match(/mywaifulist_session=(.+?);/)![1]};`,
        };
    }
    private async request<T>(s: string, method = 'GET', body?: string): Promise<T | undefined> {
        return fetch(s, {
            method,
            headers: await this.headers(),
            body,
        })
            .then(d => d.json())
            .catch(() => undefined);
    }
    public daily() {
        return fetch(constants.REST.WAIFULIST.DASH)
            .then(d => d.text())
            .then(d =>
                $('img.w-full', d)
                    .toArray()
                    .map(x => {
                        const { next } = x.parent.parent.next;
                        const name = $('div > a', next)[0];
                        return [
                            x.attribs.src.match(/waifus\/(\d+)/)![1],
                            $(name).text(),
                            $($('div > p', next)[0]).text()
                                .trim(),
                            constants.REST.WAIFULIST.BASE + name.attribs.href,
                            x.attribs.src,
                        ];
                    })[0]
            );
    }
    public search(query: string) {
        return this.request<WaifuSearch[]>(
            constants.REST.WAIFULIST.SEARCH,
            'POST',
            JSON.stringify({ query }),
        );
    }
    public async waifu(id: number | string) {
        return this.waifus.get(`${id}`) || this
            .request<Waifu>(`${constants.REST.WAIFULIST.WAIFU}${id}`)
            .then(d => {
                d && this.waifus.set(`${id}`, d);
                return d;
            });
    }
    public async waifuGallery(id: number | string, page = 0) {
        const key = `${id},${page}`;
        return this.galleries.get(key) || this
            .request<WaifuGallery>(`${constants.REST.WAIFULIST.WAIFU}${id}/gallery?page=${page}`)
            .then(d => {
                d && this.galleries.set(key, d);
                return d;
            });
    }
}