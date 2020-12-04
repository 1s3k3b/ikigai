import fetch from 'node-fetch';
import { RedditResponse } from '../types';
import constants from '../util/constants';

export default class {
    public cache: Map<string, RedditResponse> = new Map();
    public async sub(sub: string) {
        return this.cache.get(sub) || fetch(`${constants.REST.REDDIT}/r/${sub}.json`)
            .then(d => d.json())
            .then((d: RedditResponse) => {
                this.cache.set(sub, d);
                return d;
            });
    }
}