import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

const f = (n: number) => n.toLocaleString('en');

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'util',
        desc: 'Get information about an invite.',
        args: {
            '<invite>': 'The invite link or code.',
        },
        examples: ['https://discord.gg/' + constants.CONFIG.SERVER_INVITE, constants.CONFIG.SERVER_INVITE],
    };
    constructor() {
        super({
            name: 'invite',
            aliases: ['server', 'guild'],
        });
    }

    public async fn(msg: Message, { args: [inv] }: CommandInfo) {
        const d = await msg.client
            .fetchInvite(inv)
            .catch(() => undefined);
        if (!d) return msg.channel.send('Invalid invite link or code.');
        msg.channel.send({
            embed: msg.client.util
                .embed()
                .setTitle('Invite')
                .setColor('RANDOM')
                .setThumbnail(d.guild?.iconURL({ size: 2048 }) || undefined)
                .addField(!!d.guild && 'Guild', `${d.guild?.name}\nID: ${d.guild?.id}\nMember count: ${f(d.memberCount)}`)
                .addField('Channel', `${d.channel.name}\nID: ${d.channel.id}`)
                .addField(!!d.inviter && 'Inviter', `${d.inviter?.tag}\nID: ${d.inviter?.id}\nCreated at ${d.inviter?.createdAt.toDateString()}`)
                .addField(d.maxUses !== null && 'Uses', `${f(d.uses || 0)}/${f(d.maxUses || 0)}`)
                .addField((!!d.createdAt || !!d.createdAt) && 'Date', `Created at ${d.createdAt?.toDateString() || 'Unknown'}\nExpires at ${d.expiresAt?.toDateString() || 'Unknown'}`)
                .addField(!!d.temporary && 'Temporary'),
        });
    }
};