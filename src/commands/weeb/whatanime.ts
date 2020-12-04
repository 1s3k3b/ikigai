import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
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

    public async fn(msg: Message, { text }: CommandInfo) {
        const url = msg.attachments.first()?.proxyURL
            || msg.mentions.users.first()?.displayAvatarURL({ format: 'png', size: 2048 })
            || await msg.client.util.getEmoji(msg, text).then(d => d?.id && msg.client.util.emojiURL(<{ id: string; name: string; animated: boolean; }>d))
            || msg.author.displayAvatarURL({ format: 'png', size: 2048 });
        const res: WhatAnimeResponse = await fetch(`${constants.REST.WHATANIME}${encodeURIComponent(url)}`).then(d => d.json());
        msg.channel.send({
            embed: msg.client.util
                .embed()
                .setTitle('Anime Results')
                .setThumbnail(url)
                .setFooter('https://trace.moe')
                .addFields(
                    ...await Promise
                        .all(
                            res.docs
                                .slice(0, 3)
                                .map(x => msg.client.jikan.fetchAnime(x.mal_id))
                        )
                        .then(d => d.map(x => ({
                            name: '\u200b',
                            value: `[${x.title}](${x.url})\n${x.episodes} episode${x.episodes === 1 ? '' : 's'}, ${x.score} score, ${x.rating || 'Unknown'} rating\n${x.synopsis.slice(0, 200)}...`,
                        })))
                ),
        });
    }
};