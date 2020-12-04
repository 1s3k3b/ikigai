import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Translator } from 'phonetic-english';
import { Help } from '../../types';

const dots = (min = 1, max = 4) => '.'.repeat(~~(Math.random() * (max - min)) + min);

const pronounce = (str: string) =>
    Translator.spelling.ipa
        .map((x, i) => [x, Translator.spelling.default[i]])
        .reduce(
            (s, [a, b]) => s.replace(new RegExp(a, 'gi'), b),
            new Translator(Translator.spelling.ipa)
                .translate(str)
                .replace(/θ/g, 'f')
                .replace(/(r|eə|ɜ:|ɪə)/g, 'w')
                .replace(/ʧ/g, 'c'),
        )
        .replace(/yoo/g, 'u')
        .replace(/wou/g, 'waaw');
const weebify = (str: string) =>
    str
        .split(/\.|!|\?/g)
        .map(x => `${
            Math.random() > 0.6 && x
                ? `${x[0] || ''}-${x}`
                : x
        }${
            dots()
        }${
            [
                '',
                '',
                '',
                '',
                '',
                ` >${'/'.repeat(~~(Math.random() * 5) + 3)}<${dots()}`,
                ` uwu${dots()}`,
                ` owo${dots()}`,
                ` u-uwu${dots()}`,
                ` o-owo${dots()}`,
            ].sort(() => 0.5 - Math.random())[0]
        }`)
        .join('');

module.exports = class WeebifyCommand extends Command {
    public help: Help = {
        type: 2,
        category: 'weeb',
        desc: 'Weebify a given text.',
        args: {
            '<text>': 'The text to weebify.',
        },
        flags: {
            nopro: 'Removes the pronounciation-like effect from the output.',
        },
    };
    constructor() {
        super({
            name: 'weebify',
            aliases: ['uwuify'],
        });
    }

    public async fn(msg: Message, { text, flags }: CommandInfo) {
        msg.channel.send(msg.client.util.padZws(weebify(flags.nopro ? text : pronounce(text))));
    }
};
