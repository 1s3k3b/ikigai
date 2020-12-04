import { Command, CommandInfo } from 'aurora-djs';
import { Message, TextChannel } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

const pad = (n: number) => ['', '00', '0', ''][`${n}`.length] + n;

const typesF = (f?: (x: string) => Promise<string>) =>
    [
        ['ass', 'booty'],
        ['tits', 'boobs', 'boobies', 'breasts'],
        ['neko', 'catgirl', 'lewdneko'],
        ['thigh', 'thighs'],
    ].reduce(
        (a, [x, ...xs]) => (xs.map(y => a[y] = a[x]), a),
        <Record<string, () => string | Promise<string>>>{
            ass: () => f!('hass'),
            anal: () => f!('hanal'),
            kitsune: () => f!('hkitsune'),
            kemonomimi: () => f!('kemonomimi'),
            neko: () => f!('lewdneko'),
            midriff: () => f!('hmidriff'),
            thigh: () => f!('hthigh'),
            tits: () => Math.random() > 0.5 ? `${constants.REST.NEKOS_LIFE}${pad(~~(Math.random() * 112) + 4)}.jpg` : f!('hboobs'),
        }
    );

module.exports = class HentaiCommand extends Command {
    public help: Help = {
        type: 2,
        category: 'weeb',
        desc: 'Naked cartoons.',
        nsfw: true,
        args: {
            '[type]': `The type of image: \`${Object.keys(typesF()).join('`, `')}\``,
        },
    };
    constructor() {
        super({
            name: 'hentai',
        });
    }

    public async fn(msg: Message, { args: [type] }: CommandInfo) {
        if ((<TextChannel>msg.channel).nsfw || msg.channel.type === 'dm') {
            const types = typesF(msg.client.util.nekobot);
            msg.channel.send(`Here are the naked cartoons you asked for, ${msg.author}`, { files: [await types[type]?.() || await types.tits()] });
        } else msg.channel.send('You must be in an NSFW channel or DM to use this command.');
    }
};
