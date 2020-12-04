import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';

module.exports = class LyricsCommand extends Command {
    public help: Help = {
        type: 2,
        category: 'util',
        desc: 'Search the lyrics of a song.',
        args: {
            '<song>': 'The song title and/or author to search for.',
        },
    };
    constructor() {
        super({
            name: 'lyrics',
        });
    }

    public async fn(msg: Message, { text }: CommandInfo) {
        const [title, lyrics] = await msg.client.util.lyrics(text) || [];
        if (!title) return msg.channel.send('No such song found.');
        const paginated = msg.client.util
            .split(lyrics.split(''), 2048)
            .map(x => x.join(''));
        msg.client.util.paginate(
            msg,
            false,
            paginated,
            x => [{
                embed: msg.client.util
                    .embed()
                    .setTitle(title)
                    .setDescription(x)
                    .setColor('RANDOM'),
            }],
        );
    }
};