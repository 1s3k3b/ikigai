import { Command } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'text',
        desc: 'Get a zero-width-space (U200B) character.',
    };
    constructor() {
        super({
            name: 'zws',
            aliases: ['zerowidthspace', 'zero-width-space'],
        });
    }

    public async fn(msg: Message) {
        msg.channel.send('\u200b', { code: true });
    }
};