import { Command } from 'aurora-djs';
import { Message, MessageAttachment } from 'discord.js';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'image',
        desc: 'Invert an image.',
        args: {
            '[attachment|@user]': 'The attachment, or user (avatar) to invert. Defaults to the author\'s avatar.',
        },
        examples: ['@1s3k3b#0001', '<attachment>'],
    }
    constructor() {
        super({
            name: 'invert',
        });
    }

    public async fn(msg: Message) {
        msg.client.util
            .jimp(msg)
            .then(async d =>
                msg.channel.send({
                    files: [new MessageAttachment(
                        await new Promise(r => d.invert((_, x) => r(msg.client.util.jimpBuffer(x)))),
                        'inverted.png',
                    )],
                })
            );
    }
};