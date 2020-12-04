import { Command } from 'aurora-djs';
import { Message } from 'discord.js';
import { AllHtmlEntities } from 'html-entities';
import fetch from 'node-fetch';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'fun',
        desc: 'Get a random website from theuselessweb.com',
    };
    constructor() {
        super({
            name: 'uselessweb',
            aliases: ['theuselessweb'],
        });
    }

    public async fn(msg: Message) {
        const sites = await fetch(constants.REST.USELESSWEB)
            .then(d => d.text())
            .then(d =>
                d
                    .match(/(?<=var sitesList \= \[)(?:\s+".+",\s)+/g)![0]
                    .split(',')
                    .map(x => x.replace(/"/g, '').trim())
                    .filter(x => x)
            );
        const site = msg.client.util.random(sites);
        const siteCont = await fetch(site).then(d => d.text());
        const [, title = site.match(/https?:\/\/(?:www\.)?(.+\..{2,3})/)![1]] = siteCont.match(/<title>(.+)<\/title>/) || [];
        msg.channel.send({
            embed: msg.client.util
                .embed()
                .setTitle(new AllHtmlEntities().decode(title))
                .setURL(site)
                .setColor('RANDOM'),
        });
    }
};