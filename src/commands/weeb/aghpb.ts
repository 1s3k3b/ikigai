import { Constants } from 'aghpb-api';
import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class extends Command {
    public help: Help = {
        type: 1,
        name: 'aghpb',
        case: 'AGHPB',
        emoji: '📚',
        desc: `Get images of [anime girls holding programming books](${constants.REST.GITHUB}${Constants.REPO_PATH}).`,
        priority: 10,
        subcommands: [{
            name: 'random',
            aliases: ['rand'],
            desc: 'Get a random image from all languages, or a specified language.',
            args: {
                '[lang]': 'The optional language to get a random image from.',
            },
            examples: ['C++', ''],
        }, {
            name: 'search',
            aliases: ['find'],
            desc: 'Search for a term across all images.',
            args: {
                '<text>': 'The text to search for.',
            },
            flags: {
                'random, rand': 'Whether to pick a random result, or the first one.',
            },
            examples: ['mai sakurajima', 'umaru --rand'],
        }],
    };
    constructor() {
        super({
            name: 'aghpb',
            aliases: ['animegirlsholdingprogrammingbooks'],
        });
    }

    public async fn(msg: Message, { args: [type, ...args], flags }: CommandInfo) {
        switch (type?.toLowerCase()) {
        case 'random':
        case 'rand':
            const lang = msg.client.aghpb.languageProxy[args[0]];
            const arr = lang ? await lang.fetchImages() : await msg.client.aghpb.fetchAllURLs();
            return msg.channel.send({ files: [msg.client.util.random(arr)] });
        case 'search':
        case 'find':
            const res = await msg.client.aghpb.search(args.join(' '));
            return msg.channel.send(
                res
                    .slice(0, 10)
                    .map(x => `<${x}>`)
                    .join('\n'),
                {
                    files: [res[~~(Math.random() * (flags.random || flags.rand ? 10 : 0))]],
                },
            );
        default:
            msg.client.commands.get('help')!.fn(msg, <CommandInfo>{ args: [this.name] });
        }
    }
};