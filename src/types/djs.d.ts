import IkigaiUtil from '../util/Util';
import { Client as AGHPBClient } from 'aghpb-api';
import { Client as HanimeClient } from 'hanime-api';
import OsuClient from '../structures/OsuClient';
import UDClient from '../structures/UDClient';
import RedditClient from '../structures/RedditClient';
import JikanClient from '../structures/JikanClient';
import SpotifyClient from '../structures/SpotifyClient';
import { Command } from 'aurora-djs';
import { Help } from '.';
import WaifuClient from '../structures/WaifuClient';

declare module 'discord.js' {
    interface Client {
        commands: Collection<string, Command & { help: Help }>;
        util: typeof IkigaiUtil;
        aghpb: AGHPBClient;
        osu: OsuClient;
        ud: UDClient;
        reddit: RedditClient;
        hanime: HanimeClient;
        jikan: JikanClient;
        spotify: SpotifyClient;
        waifu: WaifuClient;
    }
}