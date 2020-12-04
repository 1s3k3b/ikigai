import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import fetch from 'node-fetch';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'search',
        desc: 'Get Google autocomplete suggestions for a given text.',
        args: {
            '<text>': 'The text to get autocomplete suggestions for.',
        },
    };
    constructor() {
        super({
            name: 'autocomplete',
            aliases: ['searchcomplete', 'autofill'],
        });
    }

    public async fn(msg: Message, { text }: CommandInfo) {
        const [, x]: string[][] = await fetch(constants.REST.GOOGLE.AUTOCOMPLETE + encodeURIComponent(text)).then(d => d.json());
        msg.channel.send({
            embed: msg.client.util
                .embed()
                .setTitle('Search Autocomplete')
                .setColor('RANDOM')
                .setDescription(x.map(x => `[${x}](${constants.REST.GOOGLE.SEARCH}${encodeURIComponent(x)})`).join('\n')),
        });
    }
};