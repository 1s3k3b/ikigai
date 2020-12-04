import fetch from 'node-fetch';
import { Collection } from 'discord.js';
import { OsuUser } from '../types';
import constants from '../util/constants';

export default class {
    public userCache = new Collection<string, OsuUser>();
    public tokenType?: string;
    public token?: string;
    constructor(
        public clientID: string,
        public clientSecret: string
    ) {}
    private getToken() {
        return fetch(constants.REST.OSU.AUTH, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'client_credentials',
                client_id: this.clientID,
                client_secret: this.clientSecret,
                scope: 'public',
            }),
        })
            .then(d => d.json())
            .then((d: {
                token_type: string;
                access_token: string;
                expires_in: number;
            }) => {
                setTimeout(() => {
                    delete this.tokenType;
                    delete this.token;
                }, d.expires_in);
                this.tokenType = d.token_type;
                this.token = d.access_token;
                return d;
            });
    }
    public async getUser(username: string) {
        return this.userCache.get(username) || await fetch(`${constants.REST.OSU.USER_API}${username}`, {
            headers: {
                Authorization: `${this.tokenType || (await this.getToken()).token_type} ${this.token}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        })
            .then(d => d.json())
            .then((d: OsuUser) => this.userCache.set(username, d) && d);
    }
}