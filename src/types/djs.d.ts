import { Client as AGHPBClient } from 'aghpb-api';
import { Client as HanimeClient } from 'hanime-api';
import { Client as SoundCloudClient } from 'soundcloud-scraper';
import { Command } from 'aurora-djs';
import { Help } from '.';
import IkigaiUtil from '../util/Util';
import OsuClient from '../structures/OsuClient';
import UDClient from '../structures/UDClient';
import RedditClient from '../structures/RedditClient';
import JikanClient from '../structures/JikanClient';
import SpotifyClient from '../structures/SpotifyClient';
import WaifuClient from '../structures/WaifuClient';
import NhentaiClient from '../structures/NhentaiClient';
import GitHubClient from '../structures/GitHubClient';
import TopGGClient from '../structures/TopGGClient';


declare module 'discord.js' {
    interface Client {
        commands: Collection<string, Command & { help: Help }>;
        members: number;
        util: typeof IkigaiUtil;
        aghpb: AGHPBClient;
        osu: OsuClient;
        ud: UDClient;
        reddit: RedditClient;
        hanime: HanimeClient;
        jikan: JikanClient;
        spotify: SpotifyClient;
        waifu: WaifuClient;
        nhentai: NhentaiClient;
        github: GitHubClient;
        soundcloud: SoundCloudClient;
        topgg: TopGGClient;
    }
}