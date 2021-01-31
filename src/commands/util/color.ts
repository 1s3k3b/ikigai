import { Command, CommandInfo } from 'aurora-djs';
import { Message, MessageAttachment } from 'discord.js';
import { Help } from '../../types';
import convert from 'color-convert';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'util',
        desc: 'Get an image and conversions of a color.',
        args: {
            '[color]': 'A hex, rgb, hsl, hsv, or cmyk color code, or a user.',
        },
        flags: {
            width: 'The image\'s width. Defaults to 100.',
            height: 'The image\'s height. Defaults to 100.',
        },
        examples: ['', '#00ff6a', 'rgb(0, 255, 106)', 'hsv(145°,100%,100%) --width=200'],
    };
    constructor() {
        super({
            name: 'color',
        });
    }

    public async fn(msg: Message, { text, flags }: CommandInfo) {
        const user = await msg.client.util.getUser(msg, text);
        const colorStr = (
            await msg.guild?.members
                .fetch(user?.id || '')
                .catch(() => undefined)
        )?.displayHexColor || text || msg.member?.displayHexColor;
        const [, type] = <[string, 'rgb' | 'hsl' | 'hsv' | 'cmyk'] | []>colorStr?.match(
            /^(rgb|hsl|hsv|cmyk)\((\d+(?:\D+|\)))+$/
        ) || [];
        const numbers = colorStr!
            .match(/\d+/g)
            ?.map(x => +x);
        const rgb = /^#?[\da-f]{6}$/.test(colorStr || '')
            ? <[number, number, number]>colorStr!
                .match(/[\da-f]{2}/g)!
                .map(s => parseInt(s, 16))
            : type === 'rgb'
                ? <[number, number, number]>numbers
                : type
                    // @ts-ignore
                    ? convert[type].rgb(numbers)
                    : undefined;
        if (!rgb || rgb.some(isNaN)) return msg.channel.send('Invalid color.');
        return msg.channel.send({
            embed: msg.client.util
                .embed()
                .setAuthor(user?.tag, user?.displayAvatarURL())
                .setColor(convert.rgb.hex(rgb))
                .setDescription(`• #${convert.rgb.hex(rgb)}
• rgb(${rgb.join(', ')})
${
    (<const>['hsl', 'hsv', 'cmyk'])
        .map(s => `• ${s}(${convert.rgb[s](rgb).join(', ')})`)
        .join('\n')
}`),
            files: [new MessageAttachment(
                await msg.client.util
                    .canvas(
                        +flags.width || 100,
                        +flags.height || 100,
                        convert.rgb.hex(rgb),
                    )
                    .then(d => d.get()),
                'color.png',
            )],
        });
    }
};
