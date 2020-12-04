import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Translator } from 'phonetic-english';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'text',
        desc: 'Convert text to IPA.',
        args: {
            '<text>': 'The text to convert to IPA.',
        },
    };
    constructor() {
        super({
            name: 'phonetic',
            aliases: ['ipa', 'phonetic'],
        });
    }

    public async fn(msg: Message, { text }: CommandInfo) {
        msg.channel.send(msg.client.util.padZws(new Translator(Translator.spelling.ipa).translate(text)));
    }
};