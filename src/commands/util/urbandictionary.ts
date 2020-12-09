import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'util',
        desc: 'Look up specified or random definitions on UrbanDictionary.',
        readme: 10,
        examples: ['', 'kancho'],
    };
    constructor() {
        super({
            name: 'urbandictionary',
            aliases: ['ud', 'urban', 'define'],
        });
    }

    public async fn(msg: Message, { text }: CommandInfo) {
        const { list } = await (text ? msg.client.ud.search(text) : msg.client.ud.random());
        msg.channel.send({
            embed: msg.client.util
                .embed()
                .setTitle(text ? 'Search Results' : 'Random')
                .setAuthor('Urban Dictionary', constants.REST.URBAN.IMAGE, constants.REST.URBAN.URL)
                .setColor('YELLOW')
                .addFields(list.map(x => ({
                    name: x.word,
                    value: `[${msg.client.util.slice(x.definition.replace(/\[([^\]]+)\]/g, '$1'), 1020 - x.permalink.length)}](${x.permalink})`,
                }))),
        });
    }
};