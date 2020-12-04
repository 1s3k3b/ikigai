import { Command } from 'aurora-djs';
import { Message } from 'discord.js';
import fetch from 'node-fetch';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class TWDNECommand extends Command {
    public help: Help = {
        type: 2,
        category: 'weeb',
        desc: 'Get an image of an AI-generated waifu. (thiswaifudoesnotexist.net)',
    };
    constructor() {
        super({
            name: 'thiswaifudoesnotexist',
            aliases: ['twdne'],
        });
    }

    public async fn(msg: Message) {
        const desc = `${constants.REST.TWDNE.SNIPPET}${msg.client.util.random(0, 125254)}.txt`;
        msg.channel.send({
            embed: msg.client.util
                .embed()
                .setColor('RANDOM')
                .setDescription(`[${msg.client.util.slice(await fetch(desc).then(d => d.text()), 1020 - desc.length)}](${desc})`),
            files: [`${constants.REST.TWDNE.IMAGE}${msg.client.util.random(0, 10000)}.jpg`],
        });
    }
};
