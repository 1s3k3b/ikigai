import { Command, CommandInfo } from 'aurora-djs';
import { Message, TextChannel } from 'discord.js';
import WaifuClient from '../../structures/WaifuClient';
import { Help, Waifu } from '../../types';
import constants from '../../util/constants';

const f = (n: number) => n.toLocaleString('en');

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'weeb',
        desc: 'Get info about, or search for waifus.',
        readme: 7,
        args: {
            '[text]': 'The waifu\'s name.',
        },
        flags: {
            search: 'Whether to get search results.',
            'gallery, images, pictures, pics': 'Whether to get images of the waifu. NSFW images will only be shown in NSFW channels or DMs.',
            nsfw: 'Whether to only show NSFW pictures in the gallery. Only has an effect in NSFW channels or DMs.',
        },
    };
    constructor() {
        super({
            name: 'waifu',
            aliases: ['husbando'],
        });
    }

    private resolveWaifu(c: WaifuClient, s: string) {
        return <Promise<[boolean, Waifu]>>c
            .search(s)
            .then(async d => [false, await c.waifu((d instanceof Array ? d : []).find(x => x.entity_type === 'waifu')?.id!)])
            .then(d => d[1] ? d :
                c
                    .daily()
                    .then(async d => [true, await c.waifu(d[0])])
            );
    }

    public async fn(msg: Message, { text, flags }: CommandInfo) {
        const { nsfw } = <TextChannel>msg.channel;
        if (flags.search) {
            const res = (await msg.client.waifu.search(text))!;
            return msg.client.util.paginate(
                msg,
                false,
                msg.client.util.split(res.filter(x => x.entity_type === 'waifu'), 10),
                x => [{
                    embed: msg.client.util
                        .embed()
                        .setTitle('Waifu Search')
                        .setColor('RANDOM')
                        .addFields(x.map(w => ({
                            name: '\u200b',
                            value: `[${w.name}](${w.url})\nAnimes: ${w.appearances.map(x => `[${x.name}](${x.url})`).join(', ')}\n${f(w.likes)} 👍 | ${f(w.trash)} 🗑️\n${w.description}`,
                        }))),
                }],
            );
        }
        const [daily, { data }] = await this.resolveWaifu(msg.client.waifu, text);
        if (data.nsfw && !nsfw) return msg.channel.send(`This ${data.husbando ? 'husbando' : 'waifu'} is marked as NSFW.\nPlease use this commmand in an NSFW channel or DMs instead.`);
        const embedAnimeString = `[${data.series.name}](${constants.REST.WAIFULIST.SERIES}${data.series.slug})\n• Episodes: ${data.series.episode_count || 'unknown'}\n• Original name: ${data.series.original_name || 'unknown'}\n\n`;
        const embed = msg.client.util
            .embed(true, true)
            .setTitle(data.name)
            .setURL(data.url)
            .setThumbnail(data.display_picture)
            .setColor('RANDOM')
            .addField('Stats', `Likes: ${f(data.likes)} (#${f(data.like_rank)})\nTrash: ${f(data.trash)} (#${f(data.trash_rank)})\nPopularity rank: #${f(data.popularity_rank)}`)
            .addField('Data', `Age: ${data.age} (birthday: ${[data.birthday_day, data.birthday_month, data.birthday_year].join(' ').trim() || 'unknown'})\nOriginal name: ${data.original_name || 'unknown'}\nRomaji name: ${data.romaji_name || 'unknown'}`);

        if (flags.gallery || flags.images || flags.pictures || flags.pics) {
            const nsfwPics = nsfw && flags.nsfw;
            const pics = (await msg.client.waifu.waifuGallery(data.id))!.data.filter(x => nsfwPics ? x.nsfw : nsfw || !x.nsfw);
            return msg.client.util.paginate(
                msg,
                true,
                pics,
                x => [{
                    files: [x.thumbnail],
                    embed,
                }],
            );
        }
        msg.channel.send({
            embed: embed
                .setDescription(msg.client.util.slice(data.description, 2048))
                .addField('❯ Anime', embedAnimeString + msg.client.util.slice(data.series.description, 1024 - embedAnimeString.length), false, false)
                .addField(daily && 'Daily Waifu'),
        });
    }
};