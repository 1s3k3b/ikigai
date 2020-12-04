import { Command, CommandInfo } from 'aurora-djs';
import { Message, MessageAttachment } from 'discord.js';
import Jimp from 'jimp';
import { Help } from '../../types';

const rgbToHex = ([r, g, b]: number[]) => '#' + ((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1);

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'image',
        desc: 'Apply japanese censorship laws to an entire image.',
        args: {
            '[attachment|@user]': 'The attachment, or user (avatar) to pixelate. Defaults to the author\'s avatar.',
        },
        flags: {
            n: 'The size of squares. Defaults to 10.',
        },
        examples: ['@1s3k3b#0001', '<attachment>'],
    }
    constructor() {
        super({
            name: 'pixelate',
            aliases: ['censor'],
        });
    }

    public async fn(msg: Message, { flags }: CommandInfo) {
        const n = msg.client.util.clamp(+flags.n || 10, 2, Infinity);
        const promises: Promise<void>[] = [];
        msg.client.util
            .jimp(msg)
            .then(async d => {
                const canvas = await msg.client.util.canvas(d.bitmap.width, d.bitmap.height);
                for (let y = 0; y < d.bitmap.height; y += n) {
                    for (let x = 0; x < d.bitmap.width; x += n) {
                        promises.push(
                            canvas.add(
                                rgbToHex(
                                    Array
                                        .from({ length: n }, (_, i) => i + y)
                                        .flatMap((y): number[][] => Array.from({ length: n }, (_, i) => Object.values(Jimp.intToRGBA(d.getPixelColor(x + i, y)))))
                                        .reduce((a, b) => a.map((x, i) => [...x, b[i]]), <number[][]>[[], [], []])
                                        .map(x => ~~(x.reduce((a, b) => a + b, 0) / x.length))
                                ),
                                x,
                                y,
                                n,
                                n,
                            )
                        );
                    }
                }
                await Promise.allSettled(promises);
                return msg.channel.send({
                    files: [new MessageAttachment(
                        await canvas.get(),
                        'pixelated.png',
                    )],
                });
            });
    }
};