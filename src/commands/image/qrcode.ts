import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import fetch from 'node-fetch';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'image',
        desc: 'Read a QR code.',
        args: {
            '<attachment|url>': 'The QR code.',
        },
    };
    constructor() {
        super({
            name: 'qrcode',
            aliases: ['qr'],
        });
    }

    public async fn(msg: Message, { args: [u] }: CommandInfo) {
        const img = u || msg.attachments.first()?.proxyURL;
        const res: {
            symbol: { data?: string; }[];
        }[] | undefined = await fetch(constants.REST.QR + img)
            .then(d =>
                d
                    .json()
                    .catch(() => undefined)
            );
        if (!res) return msg.channel.send('Invalid image URL or attachment.');
        if (!res[0].symbol[0].data) return msg.channel.send('No QR code found.');
        msg.channel.send(res[0].symbol[0].data);
    }
};