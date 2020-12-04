import { Command } from 'aurora-djs';
import { Message } from 'discord.js';
import fetch from 'node-fetch';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'fun',
        desc: 'Get a random fun fact.',
        readme: 11,
    };
    constructor() {
        super({
            name: 'funfact',
            aliases: ['fun-fact', 'fact'],
        });
    }

    public async fn(msg: Message) {
        msg.channel.send(
            await fetch(constants.REST.FUNFACT)
                .then(d => d.json())
                .then(d => d.text)
        );
    }
};