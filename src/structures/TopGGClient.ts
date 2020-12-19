import fetch from 'node-fetch';
import $ from 'cheerio';
import Client from '../client/Client';
import { TopGGBot, TopGGSearch } from '../types';
import constants from '../util/constants';

export default class {
    constructor(
        private token: string,
        private client: Client,
    ) {}
    private request<T>(u: string, body?: Record<string, any>, method = 'GET') {
        return <Promise<T>>fetch(
            u,
            {
                method,
                body: body && JSON.stringify(body),
                headers: {
                    Authorization: this.token,
                    'Content-Type': 'application/json',
                },
            },
        ).then(d => d.json());
    }
    public post() {
        return this.request(
            constants.REST.TOP_GG.POST,
            { server_count: this.client.guilds.cache.size },
            'POST',
        );
    }
    public voted(id: string) {
        return this
            .request<{ voted: number; }>(constants.REST.TOP_GG.VOTED + id)
            .then(d => !!d.voted);
    }
    public search(s: string) {
        return this.request<TopGGSearch>(constants.REST.TOP_GG.SEARCH + encodeURIComponent(s));
    }
    public info(id: string) {
        return <Promise<TopGGBot | undefined>>this
            .request<TopGGBot>(`${constants.REST.TOP_GG.BOT}${id}`)
            .then(d => d.id && d);
    }
    public stats(id: string) {
        return Promise.all([
            fetch(constants.REST.TOP_GG.HTML_BOT + id)
                .then(d => d.text())
                .then(d => $($('.entity-header__vote-count > b', d)[0]).text()),
            this.request<Record<'server_count' | 'shard_count', number>>(`${constants.REST.TOP_GG.BOT}${id}/stats`),
        ]);
    }
}