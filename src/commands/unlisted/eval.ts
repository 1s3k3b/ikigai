import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { inspect } from 'util';

const djs = require('discord.js');
const fetch = require('node-fetch');

module.exports = class extends Command {
    public help = {
        type: 0,
        unlisted: true,
    };
    constructor() {
        super({
            name: 'eval',
            aliases: ['e'],
            ownerOnly: true,
        });
    }

    public async fn(msg: Message, { text, flags }: CommandInfo) {
        const { client } = msg;
        try {
            const evaled = await eval(text);
            const str = flags.noins ? String(evaled) : inspect(evaled, {
                depth: typeof flags.depth === 'string' ? +flags.depth || 2 : typeof flags.depth === 'boolean' ? Infinity : 2,
                showHidden: !!flags.showhidden,
            });
            if (!flags.noout) await msg.channel.send(
                flags.send
                    ? evaled
                    : str.length > 2000
                        ? await msg.client.util.haste(str, !flags.raw)
                        : str,
                { code: str.length < 2000 && !flags.send ? 'js' : undefined },
            );
        } catch (e) {
            msg.channel.send(e.message || e, { code: true });
        }
    }
};