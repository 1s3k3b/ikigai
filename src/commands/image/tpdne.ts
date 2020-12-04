import { Command } from 'aurora-djs';
import { Message, MessageAttachment } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'image',
        desc: `Get an AI-generated person from [tpdne](${constants.REST.TPDNE.BASE})`,
    };
    constructor() {
        super({
            name: 'thispersondoesnotexist',
            aliases: ['tpdne'],
        });
    }

    public async fn(msg: Message) {
        msg.channel.send({ files: [new MessageAttachment(constants.REST.TPDNE.IMG, 'tpdne.jpeg')] });
    }
};
