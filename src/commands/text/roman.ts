import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'text',
        desc: 'Conversions between roman and arabic numerals.',
        args: {
            '<number>': 'The roman or arabic number.',
        },
        examples: ['9', 'LXIX'],
    };
    constructor() {
        super({
            name: 'roman',
        });
    }

    public async fn(msg: Message, { args: [n = ''] }: CommandInfo) {
        if (/^\d+$/.test(n)) return msg.channel.send(msg.client.util.numToRoman(n));
        if (new RegExp(`^[${Object.keys(constants.ROMAN.CONVERSION).join('')}]+$`).test(n)) return msg.channel.send(msg.client.util.romanToNum(n));
        msg.channel.send('Invalid number.');
    }
};