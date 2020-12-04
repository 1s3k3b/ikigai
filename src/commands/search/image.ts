import { Command, CommandInfo } from 'aurora-djs';
import { Message, MessageAttachment } from 'discord.js';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'search',
        desc: 'Search images from dogpile.',
        args: {
            '<term>': 'The term to search for.',
        },
        flags: {
            'random': 'Whether to send a random image.',
        },
    };
    constructor() {
        super({
            name: 'imagesearch',
            aliases: ['searchimage'],
        });
    }

    public async fn(msg: Message, { text, flags }: CommandInfo) {
        const res = await msg.client.util.dogpile(text);
        if (!res.length) return msg.channel.send('No images found.');
        if (flags.random) return msg.channel.send({ files: [new MessageAttachment(msg.client.util.random(res), `${text}.png`)] });
        msg.client.util.paginate(
            msg,
            true,
            res,
            x => [{ files: [new MessageAttachment(x, `${text}.png`)] }],
        );
    }
};