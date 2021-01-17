import { Command, CommandInfo } from 'aurora-djs';
import { Message, TextChannel } from 'discord.js';
import fetch from 'node-fetch';
import { Help, WhatAnimeResponse } from '../../types';
import constants from '../../util/constants';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'weeb',
        desc: 'Find what anime a character is from based on an image. [(credit)](https://trace.moe)',
    };
    constructor() {
        super({
            name: 'whatanime',
            aliases: ['findcharacter', 'findchar', 'whatcharacter', 'whatchar'],
        });
    }

    private formatSeconds(n: number) {
        return `${~~(n / 60)}:${(~~(n % 60)).toString().padStart(2, '0')}`;
    }

    public async fn(msg: Message, { text }: CommandInfo) {
        const url = msg.attachments.first()?.proxyURL
            || msg.mentions.users.first()?.displayAvatarURL({ format: 'png', size: 2048 })
            || await msg.client.util.getEmoji(msg, text).then(d => d?.id && msg.client.util.emojiURL(<{ id: string; name: string; animated: boolean; }>d))
            || msg.author.displayAvatarURL({ format: 'png', size: 2048 });
        const arr: WhatAnimeResponse['docs'] = [];
        let i = 0;
        while (
            !arr.some(x => x.similarity > 0.9)
                && i < 3
        ) arr.push(
            ...await fetch(`${constants.REST.WHATANIME.SEARCH}${encodeURIComponent(url)}&trial=${++i}`)
                .then(d => d.json())
                .then(d => d.docs)
        );
        return msg.client.util.paginate(
            msg,
            false,
            arr
                .filter(x => x.is_adult === ((<TextChannel>msg.channel).nsfw || msg.channel.type === 'dm'))
                .sort((a, b) => b.similarity - a.similarity),
            async x => {
                const mal = await msg.client.jikan.fetchAnime(x.mal_id);
                return [{
                    embed: msg.client.util
                        .embed()
                        .setTitle(mal.title)
                        .setColor('RANDOM')
                        .setDescription(`[${mal.title_english || mal.title}](${mal.url})\n[${mal.title_japanese || mal.title}](${mal.url})\n[Trailer](${mal.trailer_url})`)
                        .setThumbnail(mal.image_url)
                        .setImage(`${constants.REST.WHATANIME.IMG_PREVIEW}${x.anilist_id}&file=${encodeURIComponent(x.filename)}&t=${x.at}&token=${x.tokenthumb}`)
                        .addField('Image', `Similarity: ${(x.similarity * 100).toFixed(1)}%\nEpisode: ${x.episode || 'Unknown'}\nTimestamp: [${x.to - x.from < 1 ? this.formatSeconds(x.at) : [x.from, x.to].map(this.formatSeconds).join('-')}](${constants.REST.WHATANIME.VID_PREVIEW}${x.anilist_id}/${encodeURIComponent(x.filename)}?t=${x.at}&token=${x.tokenthumb})`)
                        .addField('Stats', `${mal.score || 0} score\n#${mal.rank.toLocaleString('en')} rank\n${mal.episodes} episodes\n${mal.duration} duration\nRated ${mal.rating}`)
                        .addField('Genres', mal.genres.map(x => `[${x.name}](${x.url})`).join('\n'))
                        .addField('Status', `${mal.status}\n${mal.aired.string}`),
                }];
            },
            0,
            [arr.length ? 'All results were NSFW. Use this command in an NSFW channel or a DM to enable NSFW results.' : 'No results found.'],
        );
    }
};