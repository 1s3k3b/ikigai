import { Command, CommandInfo } from 'aurora-djs';
import { Message, TextChannel } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'weeb',
        desc: 'Search body pillows on dakimakura.com',
        nsfw: true,
        readme: 18,
        args: {
            '<text>': 'The term to search.',
        },
        flags: {
            el: 'The index of the element to view. Defaults to 1.',
        },
    };
    constructor() {
        super({
            name: 'bodypillow',
            aliases: ['dakimakura'],
        });
    }

    public async fn(msg: Message, { text, flags }: CommandInfo) {
        if (!(<TextChannel>msg.channel).nsfw && msg.channel.type !== 'dm') return msg.channel.send('Some results might be NSFW. Please use this command in an NSFW channel or DMs instead.');
        const start = Date.now();
        const res = await msg.client.util.dakimakura(text);
        const end = Date.now();
        if (!res.length) return msg.channel.send('No results found.');
        msg.client.util.paginate(
            msg,
            false,
            res,
            x => [{
                embed: msg.client.util
                    .embed()
                    .setTitle('Search Results')
                    .setURL(`${constants.REST.DAKIMAKURA}${encodeURIComponent(text)}`)
                    .setColor('RANDOM')
                    .setDescription(`${res.length} result${res.length > 1 ? 's' : ''} (${((end - start) / 1000).toFixed(2)} seconds)`)
                    .addField('Name', `[${x.name}](${x.url})`)
                    .setImage(x.img),
            }],
            /^\d+$/.test(`${flags.el}`) ? +flags.el - 1 : 0,
        );
    }
};