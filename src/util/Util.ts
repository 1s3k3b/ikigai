import {
    MessageEmbedOptions,
    Message,
    MessageOptions,
    ReactionCollector,
    GuildMember,
    Util as DUtil,
    Collection,
    Client,
} from 'discord.js';
import fetch from 'node-fetch';
import { findBestMatch } from 'string-similarity';
import $ from 'cheerio';
import Jimp from 'jimp';
import constants from './constants';
import { CommandHelp, Help, JishoWord, YouTubeSearchVideo } from '../types';
import MessageEmbed from '../structures/MessageEmbed';

type Dict<T = string> = Record<string, T>;

export default class Util {
    public static random<T>(a: T[]): T;
    public static random<T>(x: Record<string, T>): T;
    public static random(x: number, y: number): number;
    public static random<T>(x: number | Record<string, T> | T[], y?: number) {
        if (typeof x === 'number') return ~~(Math.random() * (y! - x)) + x;
        if (x instanceof Array) return x[~~(Math.random() * x.length)];
        return this.random(Object.values(x));
    }
    public static clamp(a: number, b: number, c: number) {
        return Math.max(b, Math.min(a, c));
    }
    public static capitalize(s: string) {
        return `${s[0].toUpperCase()}${s.slice(1).toLowerCase()}`;
    }
    public static padZws(s: string) {
        return s.padStart(1, '\u200b');
    }
    public static slice(s: string, n: number) {
        return s.length > n ? `${s.slice(0, n - 3)}...` : s;
    }
    public static split<T>(x: T[], n: number, f = (s: T[], x: T) => s.length === n) {
        return x.reduce(
            (a, b) =>
                f(a[a.length - 1], b)
                    ? [...a, [b]]
                    : [...a.slice(0, -1), [...a[a.length - 1], b]],
            <T[][]>[[]],
        );
    }
    public static progress<T>(a: T[][]) {
        return a.map((x, i) => [
            ...a.slice(0, i).flat(Infinity),
            ...x,
        ]);
    }
    public static merge<T, U>(a: T[], b: U[]): [T, U][] {
        return a.map((x, i) => [x, b[i]]);
    }
    public static numToRoman(n: string) {
        const digits = n.split('');
        let res = '';
        let i = 3;
        while (i--) res = (constants.ROMAN.ARR[+digits.pop()! + (i * 10)] || '') + res;
        return Array
            .from({ length: +digits.join('') + 1 })
            .join('M') + res;
    }
    public static romanToNum(n: string) {
        return n
            .split('')
            .map(x => constants.ROMAN.CONVERSION[x])
            .reduce((a, b, i, xs) => a + (b < xs[i + 1] ? 0 - b : b), 0);
    }
    public static strToBin(s: string) {
        return s
            .split('')
            .map(
                x => x
                    .charCodeAt(0)
                    .toString(2)
                    .padStart(8, '0')
            )
            .join(' ');
    }
    public static binToStr(s: string) {
        return s
            .split(' ')
            .map(x => String.fromCharCode(parseInt(x, 2)))
            .join('');
    }
    public static emojiURL(x: {
        id: string;
        animated: boolean;
    }) {
        return `${constants.REST.DISCORD_EMOJI}${x.id}.${x.animated ? 'gif' : 'png'}`;
    }
    public static setImmediateInterval(fn: (...args: any[]) => any, ms: number) {
        fn();
        return setInterval(fn, ms);
    }
    public static embed(inline = false, bulletPoints = true, d?: MessageEmbedOptions) {
        return new MessageEmbed(inline, bulletPoints, d);
    }
    public static loadCommands(c: Client) {
        const categories: Dict<string> = {
            weeb: '🇯🇵',
            util: '🛠️',
            fun: '😄',
            text: '🇹',
            nsfw: '🔞',
            image: '🖼️',
            search: '🔍',
        };
        const categoryDescriptions: Dict = {
            weeb: 'Weeb, and weeb NSFW commands.',
            util: 'Utility commands.',
            fun: 'Fun commands.',
            text: 'Text related commands.',
            nsfw: 'Regular NSFW commands.',
            image: 'Image manipulation commands.',
            search: 'Search commands.',
        };
        const categoryCases: Dict = {
            weeb: 'Weeb',
            util: 'Util',
            fun: 'Fun',
            text: 'Text',
            nsfw: 'NSFW',
            image: 'Image',
            search: 'Search',
        };
        const categoryPriorities: Dict<number> = {
            weeb: 2,
            util: 3,
            fun: 4,
            text: 5,
            nsfw: 7,
            image: 9,
            search: 11,
        }; 

        return {
            commands: <(CommandHelp & { name: string; aliases: string[]; })[]><unknown>(
                <{
                    commands: Collection<string, {
                        help: Help;
                        name: string;
                        aliases: string[];
                    }>;
                }>c
            ).commands
                .array()
                .flatMap(x => {
                    if (!x.help.type) return [];
                    if (x.help.type === 1) {
                        categories[x.name] = x.help.emoji;
                        categoryDescriptions[x.name] = x.help.desc;
                        categoryCases[x.name] = x.help.case;
                        categoryPriorities[x.name] = x.help.priority;
                        return x.help.subcommands.map(y => <CommandHelp>({
                            ...y,
                            aliases: [...y.aliases || [], y.name],
                            type: 2,
                            category: x.name,
                            prefix: `${constants.CONFIG.PREFIX}${x.name} `,
                        }));
                    }
                    return {
                        ...x,
                        ...x.help,
                        prefix: constants.CONFIG.PREFIX,
                    };
                }),
            categories,
            categoryDescriptions,
            categoryCases,
            categoryPriorities,
        };
    }
    public static paginate<T>(msg: Message, resend: boolean, arr: T[], cb: (x: T) => (string | MessageOptions)[], none?: (string | MessageOptions)[]) {
        const emojis = ['⬅️', '➡️'];
        let last: Message;
        let collector: ReactionCollector;
        const fn = async (i: number) => {
            const el = arr[this.clamp(i, 0, arr.length - 1)];
            if (!el) return none && msg.channel.send(...<[string, MessageOptions]>none);
            const x = <[string, MessageOptions]>await cb(el);
            last = <Message>await (resend ? (last?.delete(), msg.channel.send(...x)) : (last?.edit(...x) || msg.channel.send(...x)));
            for (const em of emojis) await last.react(em);
            collector?.stop();
            collector = last
                .createReactionCollector((a, b) => emojis.includes(a.emoji.name) && b.id === msg.author.id)
                .on('collect', (e, u) => (resend || e.users.remove(u).catch(() => {})) && fn(e.emoji.name === emojis[0] ? i - 1 : i + 1));
        };
        fn(0);
    }
    public static async getUser(msg: Message, text: string) {
        if (msg.mentions.users.size) return msg.mentions.users.first();
        if (/\d{17,21}/.test(text)) {
            try {
                return await msg.client.users.fetch(text);
            }
            catch {}
        }
        const buf = Buffer
            .from(text.split('.')[0], 'base64')
            .toString();
        if (/\d{17,21}/.test(buf)) {
            try {
                return await msg.client.users.fetch(buf);
            }
            catch {}
        }
        const members = await msg.guild?.members.fetch();
        if (!members) return;
        const arr = (<((x: GuildMember) => string)[]>[x => x.displayName, x => x.user.username, x => x.user.tag]).map(fn => findBestMatch(text, members.map(fn)));
        const best = arr.sort((a, b) => b.bestMatch.rating - a.bestMatch.rating)[0];
        const res = members.array()[best.bestMatchIndex];
        return text && best.bestMatch.rating > 0.4 ? res.user : undefined;
    }
    public static async getEmoji(msg: Message, str: string) {
        return DUtil.parseEmoji(str)?.id
            ? DUtil.parseEmoji(str)
            : (
                msg.mentions.users.first()
                    || await this.getUser(msg, str)
                    || msg.author
            ).presence.activities.find(x => x.type === 'CUSTOM_STATUS')?.emoji;
    }
    public static async hasteMessage(msg: Message, str: string, cb = false) {
        return msg.channel.send(str.length > 1993 ? await this.haste(str, false) : cb ? '```\n' + str + '```' : str);
    }
    public static haste(text: string, lang: boolean) {
        return fetch(`${constants.REST.HASTEBIN_BASE}documents`, {
            method: 'POST',
            body: text,
        })
            .then(d => d.json())
            .then((d: { key: string }) => `${constants.REST.HASTEBIN_BASE}${lang ? '' : 'raw/'}${d.key}${lang ? '.js' : ''}`);
    }
    public static async lyrics(s: string) {
        const { response: { hits: [res] } } = await fetch(
            constants.REST.GENIUS_SEARCH + encodeURIComponent(s),
            { headers: { Authorization: `Bearer ${process.env.GENIUS_TOKEN}` } },
        ).then(d => d.json());
        if (!res) return;
        const { result: { url, full_title } } = res;
        while (true) {
            const r = await fetch(url).then(d => d.text());
            const l = $('.lyrics', r);
            if (l[0]) {
                return <string[]>[
                    full_title,
                    $(l[0])
                        .text()
                        .trim()
                        .replace(/(^|\n)[.+]/g, ''),
                ];
            }
        }
    }
    public static dogpile(s: string) {
        return fetch(`${constants.REST.DOGPILE}${encodeURIComponent(s)}`)
            .then(d => d.text())
            .then(d => $('.image > a > img', d).toArray()
                .map(x => x.attribs.src));
    }
    public static randomDoujin() {
        return fetch(constants.REST.RANDOM_DOUJIN)
            .then(d => d.text())
            .then(d => `${
                JSON.parse(
                    d
                        .match(/JSON\.parse\("(.+)"\)/)![1]
                        .replace(/\\u\d+\w/g, x => eval(`'${x}'`))
                ).id
            }`);
    }
    public static nekobot(t: string): Promise<string> {
        return fetch(`${constants.REST.NEKOBOT}${t}`)
            .then(d => d.json())
            .then(d => d.message);
    }
    public static jisho(s: string): Promise<JishoWord[]> {
        return fetch(`${constants.REST.JISHO}${s}`)
            .then(d => d.json())
            .then(d => d.data);
    }
    public static youtube(q: string): Promise<YouTubeSearchVideo[]> {
        return fetch(`${constants.REST.YOUTUBE.SEARCH}${encodeURIComponent(q)}`)
            .then(d => d.text())
            .then(d =>
                JSON
                    .parse(
                        d.match(/(?<=var ytInitialData = )(.+);<\/script>/)![1]
                    )
                    .contents
                    .twoColumnSearchResultsRenderer
                    .primaryContents
                    .sectionListRenderer
                    .contents[0]
                    .itemSectionRenderer
                    .contents
                    .flatMap((x: Record<string, unknown>) =>
                        Object.keys(x)[0] === 'videoRenderer'
                            ? Object.values(x)[0]
                            : []
                    )
            );
    }
    public static eitherio(): Promise<Record<'prefix' | 'option_1' | 'option_2' | 'option1_total' | 'option2_total', string>> {
        return fetch(constants.REST.EITHER)
            .then(d => d.text())
            .then(d => JSON.parse(d.match(/(?<=initial_question = )(.+)/)![0]).question);
    }
    public static dakimakura(q: string) {
        return fetch(constants.REST.DAKIMAKURA + encodeURIComponent(q))
            .then(d => d.text())
            .then(d => Promise.all($('#productLayout > li > article > div.card-body > h4.card-title > a', d)
                .toArray()
                .map(async x => ({
                    name: $(x).text(),
                    url: x.attribs.href,
                    img: await fetch(x.attribs.href)
                        .then(d => d.text())
                        .then(d => $('figure[data-fancybox="images"]', d)[0].attribs.href),
                }))
            ));
    }
    public static async canvas(w: number, h: number, color = '#000000') {
        return {
            d: <Jimp>await new Promise(r => new Jimp(w, h, color, (_, d) => r(d))),
            async add(color: string, x: number, y: number, w = 1, h = 1) {
                this.d = await new Promise(async r => this.d.blit((await Util.canvas(w, h, color)).d, x, y, (_, d) => r(d)));
            },
            line(color: string, ...[a, b, c, d]: number[]) {
                const promises: Promise<void>[] = [];
                const off = Math.abs(c - a) / Math.abs(d - b);
                let x = a;
                let y = b;
                while (Math.round(x) !== c || Math.round(y) !== d) promises.push(this.add(
                    color,
                    x += c > a ? off : 0 - off,
                    y += d > b ? 1 : 0 - 1,
                ));
                return Promise.allSettled(promises);
            },
            get() {
                return Util.jimpBuffer(this.d);
            },
        };
    }
    public static jimp(msg: Message) {
        return Jimp.read(
            msg.attachments.first()?.proxyURL
                ?? (msg.mentions.users.first() || msg.author).displayAvatarURL({
                    format: 'png',
                    size: 2048,
                })
        );
    }
    public static async jimpBuffer(x: Jimp) {
        return Buffer.from((await x.getBase64Async('image/png')).split(',')[1], 'base64');
    }
    public static rgbToHex([r, g, b]: number[]) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b)
            .toString(16)
            .slice(1);
    }
    public static getClosestColor([r, g, b]: number[], colors: number[][]) {
        const f = ([r2, g2, b2]: number[]) => Math.sqrt(
            Math.pow(r - r2, 2)
                + Math.pow(g - g2, 2)
                + Math.pow(b - b2, 2)
        );
        return this.rgbToHex(colors.sort((a, b) => f(a) - f(b))[0]);
    }
}