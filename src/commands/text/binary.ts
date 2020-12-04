import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'text',
        desc: 'Conversions between utf8 and binary.',
        args: {
            '<text>': 'The text to encode or decode.',
        },
        examples: ['test', '01110100 01100101 01110011 01110100'],
    };
    constructor() {
        super({
            name: 'binary',
        });
    }

    public async fn(msg: Message, { text }: CommandInfo) {
        msg.client.util.hasteMessage(
            msg,
            /^([01]+( |$))+$/.test(text)
                ? msg.client.util.binToStr(text)
                : msg.client.util.padZws(msg.client.util.strToBin(text)),
            true
        );
    }
};