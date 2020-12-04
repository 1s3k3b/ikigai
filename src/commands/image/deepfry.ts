import { Command } from 'aurora-djs';
import { Message, MessageAttachment } from 'discord.js';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'image',
        desc: 'Deepfry an image.',
        args: {
            '[attachment|@user]': 'The attachment, or user (avatar) to deepfry. Defaults to the author\'s avatar.',
        },
    };
    constructor() {
        super({
            name: 'deepfry',
        });
    }

    public async fn(msg: Message) {
        msg.client.util
            .jimp(msg)
            .then(async d => msg.channel.send({
                files: [new MessageAttachment(
                    await msg.client.util.jimpBuffer(
                        d
                            .pixelate(3)
                            .posterize(4)
                            .contrast(0.95)
                    ),
                    'deepfry.png',
                )],
            }));
    }
};