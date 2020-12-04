import { Command, CommandInfo } from 'aurora-djs';
import { Message, TextChannel } from 'discord.js';
import { Help } from '../../types';

const types: Record<string, string> = {
    ass: 'ass',
    anal: 'anal',
    thigh: 'thigh',
    tits: 'boobs',
    gif: 'pgif',
    pussy: 'pussy',
};
[
    ['ass', 'booty'],
    ['tits', 'boobs', 'boobies', 'breasts'],
    ['thigh', 'thighs'],
    ['pussy', 'cooch', 'coochie', 'vagina'],
].map(([x, ...xs]) => xs.map(y => types[y] = types[x]));

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'nsfw',
        desc: 'Nudity.',
        nsfw: true,
        args: {
            '[type]': `The type of image: \`${Object.keys(types).join('`, `')}\``,
        },
    };
    constructor() {
        super({
            name: 'porn',
        });
    }

    public async fn(msg: Message, { args: [type] }: CommandInfo) {
        if ((<TextChannel>msg.channel).nsfw || msg.channel.type === 'dm') {
            msg.channel.send({ files: [await msg.client.util.nekobot(types[type] || types.tits)] });
        } else msg.channel.send('You must be in an NSFW channel or DM to use this command.');
    }
};