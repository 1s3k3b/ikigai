import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class extends Command {
    public help: Help = {
        type: 1,
        name: 'urbandictionary',
        case: 'UrbanDictionary',
        emoji: '📚',
        desc: 'Look up specified or random definitions on UrbanDictionary.',
        priority: 6,
        subcommands: [{
            name: 'random',
            aliases: ['rand'],
            desc: 'Get 10 random definitions.',
            examples: [''],
        },
        {
            name: 'search',
            aliases: ['get', 'define'],
            desc: 'Look up a specific phrase.',
            readme: 10,
            args: {
                '<text>': 'The text to search for.',
            },
            examples: ['kancho'],
        }],
    };
    constructor() {
        super({
            name: 'urbandictionary',
            aliases: ['ud', 'urban', 'define'],
        });
    }

    public async fn(msg: Message, { args: [type, ...args] }: CommandInfo) {
        type = ['random', 'rand', 'search', 'get', 'define'].find(x => `${type}`.toLowerCase() === x) || 'random';
        const { list } = await (['random', 'rand'].includes(type) ? msg.client.ud.random() : msg.client.ud.search(args.join(' ')));
        msg.channel.send({
            embed: msg.client.util
                .embed()
                .setTitle(['random', 'rand'].includes(type) ? 'Random' : 'Search Results')
                .setAuthor('Urban Dictionary', constants.REST.URBAN.IMAGE, constants.REST.URBAN.URL)
                .setColor('YELLOW')
                .addFields(list.map(x => ({
                    name: x.word,
                    value: `[${msg.client.util.slice(x.definition.replace(/\[([^\]]+)\]/g, '$1'), 1020 - x.permalink.length)}](${x.permalink})`,
                }))),
        });
    }
};