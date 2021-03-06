import { Client, Command } from 'aurora-djs';
import { Collection, Intents, User } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync, statSync } from 'fs';
import Table from 'ascii-table';
import { Client as AGHPBClient } from 'aghpb-api';
import { Client as HanimeClient, Video } from 'hanime-api';
import { Client as SCClient } from 'soundcloud-scraper';
import generate from '../../generators';
import Util from '../util/Util';
import { Help } from '../types';
import constants from '../util/constants';
import OsuClient from '../structures/OsuClient';
import UDClient from '../structures/UDClient';
import RedditClient from '../structures/RedditClient';
import JikanClient from '../structures/JikanClient';
import SpotifyClient from '../structures/SpotifyClient';
import WaifuClient from '../structures/WaifuClient';
import NhentaiClient from '../structures/NhentaiClient';
import GitHubClient from '../structures/GitHubClient';
import TopGGClient from '../structures/TopGGClient';

const DEV = process.argv.includes('dev');
const pkg: {
    version: string;
    dependencies: Record<string, string>,
    devDependencies: Record<string, string>,
} = require('../../../package.json');
config({ path: '.env' });

export default class extends Client {
    public util = Util;
    public aghpb = new AGHPBClient(`Bearer ${process.env.GH_TOKEN}`);
    public osu = new OsuClient(process.env.OSU_ID!, process.env.OSU_TOKEN!);
    public ud = new UDClient();
    public reddit = new RedditClient();
    public hanime = new HanimeClient();
    public jikan = new JikanClient();
    public spotify = new SpotifyClient();
    public waifu = new WaifuClient();
    public nhentai = new NhentaiClient();
    public github = new GitHubClient(`Bearer ${process.env.GH_TOKEN}`);
    public soundcloud = new SCClient();
    public topgg = new TopGGClient(process.env.TOP_GG_TOKEN!, this);
    public commands!: Collection<string, Command & { help: Help; }>;
    constructor() {
        super({
            prefixes: [constants.CONFIG.PREFIX, '{{mention}}'],
            commands: readdirSync('./dist/src/commands')
                .map(p => `./dist/src/commands/${p}`)
                .flatMap(p =>
                    statSync(p).isDirectory()
                        ? readdirSync(p).map(x => `${p}/${x}`)
                        : p
                ),
            owner: constants.CONFIG.OWNER,
            token: DEV ? process.env.DEV_DAPI_TOKEN! : process.env.PROD_DAPI_TOKEN!,
            ignoreDMs: false,
            ignoreBots: true,
            args: { flags: true },
            ws: { intents: Intents.ALL },
        });

        this.aghpb.init();
        for (const s of <const>['allTags', 'allArtists', 'allParodies', 'allGroups']) this.nhentai[s]();

        this.on('ready', async () => {
            const t = new Table('Info').setAlignCenter(1);
            for (
                const a of [
                    ['Version', pkg.version],
                    ['Dependencies', Object.keys(pkg.dependencies).length],
                    ['Dev Dependencies', Object.keys(pkg.devDependencies).length],
                    ['Servers', this.guilds.cache.size],
                    ['Members', this.members],
                    ['Channels', this.channels.cache.size],
                    ['Commands', this.commands.size],
                    ['Client', this.user!.tag],
                    ['Owner', (<User>(await this.fetchApplication()).owner).tag],
                ]
            ) t.addRow(...a);
            console.log(t.toString());

            if (process.argv.includes('generate')) generate(this);

            const _this = this;
            const trending: Trending = {
                last: Date.now(),
                async fetch() {
                    return this.data = await Promise.all((await _this.hanime.fetchTrending()).map(x => x.fetch()));
                },
            };
            await trending.fetch();
            this.util.setImmediateInterval(
                () => this.setActivity(trending),
                constants.CONFIG.STATUS_INTERVAL,
            );
            if (!DEV) this.util.setImmediateInterval(
                () => this.topgg.post(),
                constants.CONFIG.TOP_GG_POST_INTERVAL,
            );
        });
    }

    public get members() {
        return this.guilds.cache.reduce((a, b) => a + (b.memberCount || 0), 0);
    }

    public async setActivity(trending: Trending) {
        if (Date.now() - trending.last > 1000 * 60 * 60 * 3) await trending.fetch();
        this.user!.setPresence({
            activity: this.util.random([
                ...constants.CONFIG.ACTIVITIES(this),
                ...trending.data!
                    .slice(0, 10)
                    .map(v => ({
                        name: v.data.name,
                        type: <const>'WATCHING',
                    })),
            ]),
        });
    }
}

interface Trending {
    last: number;
    data?: Video[];
    fetch(): Promise<Video[]>;
}