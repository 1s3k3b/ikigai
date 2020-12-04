import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'search',
        desc: 'Search YouTube videos.',
        args: {
            '<query>': 'The query to search for.',
        },
    };
    constructor() {
        super({
            name: 'youtube',
            aliases: ['yt'],
        });
    }

    public async fn(msg: Message, { text }: CommandInfo) {
        const start = Date.now();
        const res = await msg.client.util.youtube(text);
        const end = Date.now();
        if (!res.length) return msg.channel.send('No search results.');
        msg.client.util.paginate(
            msg,
            false,
            msg.client.util.split(res, 5),
            a => [{
                embed: msg.client.util
                    .embed(false, false)
                    .setTitle('YouTube Search')
                    .setURL(`${constants.REST.YOUTUBE.SEARCH}${encodeURIComponent(text)}`)
                    .setDescription(`${res.length} results (${((end - start) / 1000).toFixed(2)} second${res.length > 1 ? 's' : ''})`)
                    .setColor('RED')
                    .addFields(a.map(x => ({
                        name: '\u200b',
                        value: `[${x.title.runs[0].text}](${constants.REST.YOUTUBE.VIDEO}${x.videoId})
[${x.ownerText.runs[0].text}](${constants.REST.YOUTUBE.BASE}${
                            x.ownerText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl
                        }) - ${x.publishedTimeText ? x.publishedTimeText.simpleText + ', ' : ''}${x.viewCountText?.simpleText || ''}
${x.descriptionSnippet?.runs[0].text || ''}`,
                    }))),
            }]
        );
    }
};