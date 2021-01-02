import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

const f = (n: number) => n.toLocaleString('en');

module.exports = class extends Command {
    public help: Help = {
        type: 1,
        name: 'github',
        case: 'GitHub',
        desc: `Commands to interact with [GitHub](${constants.REST.GITHUB.HTML_BASE}).`,
        emoji: constants.EMOJIS.GITHUB.ICON,
        priority: 5,
        subcommands: [{
            name: 'user',
            aliases: ['profile'],
            desc: 'Get info about a user, or a list of an user\'s repositories.',
            args: {
                '<username>': 'The user\'s unique username.',
            },
            flags: {
                repos: 'Whether to give a list of the user\'s repositories.',
            },
        }, {
            name: 'repository',
            aliases: ['repo'],
            desc: 'Get info about a repository.',
            args: {
                '<id>': 'The repository\'s identifier: `user/repo_name`',
            },
            examples: ['1s3k3b/ikigai'],
        }],
    };
    constructor() {
        super({
            name: 'github',
            aliases: ['gh'],
        });
    }

    public async fn(msg: Message, { args: [type, ...args], text, flags }: CommandInfo) {
        const resType = [['user', 'profile'], ['repository', 'repo']].find(x => x.includes(type?.toLowerCase()))?.[0]
            || (args.unshift(type), text.split('/').length === 2 ? 'repository' : 'user');
        switch (resType) {
        case 'user': {
            const res = await msg.client.github.fetchUser(args[0]);
            if (!res) return msg.channel.send('User not found.');
            if (flags.repos) return msg.client.util.paginate(
                msg,
                false,
                msg.client.util.split(
                        (await msg.client.github.fetchRepos(args[0]))!
                            .sort((a, b) => b.forks + b.stargazers_count - (a.forks + a.stargazers_count)),
                        5,
                ),
                a => [{
                    embed: msg.client.util
                        .embed()
                        .setTitle(`${res.login}'s Repositories`)
                        .setColor('RANDOM')
                        .setDescription(!!res.bio && res.bio)
                        .setThumbnail(res.avatar_url)
                        .setURL(res.html_url)
                        .addFields(a.map(r => ({
                            name: '\u200b',
                            value: `[${r.name}](${r.svn_url}) ${(<(keyof typeof r)[]>['fork', 'archived', 'disabled']).map(s => r[s] ? `(${msg.client.util.capitalize(s)})` : '').join(' ')}${r.description ? '\n' + r.description : ''}
${
                            [
                                r.language || '',
                                ...(<[number, string][]>[
                                    [r.stargazers_count, '⭐'],
                                    [r.forks, constants.EMOJIS.GITHUB.FORKS],
                                    [r.open_issues, constants.EMOJIS.GITHUB.ISSUES],
                                ])
                                    .map(([n, s]) => n ? `${f(n)} ${s}` : ''),
                            ]
                                .filter(x => x)
                                .join(' | ')
                            }`,
                        }))),
                }],
            );
            return msg.channel.send({
                embed: msg.client.util
                    .embed()
                    .setTitle('GitHub User')
                    .setColor('RANDOM')
                    .setDescription(!!res.bio && res.bio)
                    .setThumbnail(res.avatar_url)
                    .setURL(res.html_url)
                    .addField('Data', `Username: ${res.login}\nName: ${res.name || 'None'}\nLocation: ${res.location || 'Unknown'}\nCreated at: ${new Date(res.created_at).toDateString()}\nUpdated at: ${new Date(res.updated_at).toDateString()}`)
                    .addField('Stats', `Public repositories: ${res.public_repos}\nPublic gists: ${res.public_gists}\nFollowers: ${f(res.followers)}\nFollowing: ${f(res.following)}`)
                    .addField(
                        'Socials',
                        (<[string, keyof typeof res][]>[
                            ['Website', 'blog'],
                            ['E-mail', 'email'],
                            ['Twitter', 'twitter_username'],
                            ['Company', 'company'],
                        ])
                            .filter(([, k]) => res[k])
                            .map(([n, k]) => `${n}: ${res[k]}`)
                            .join('\n') || 'None'
                    )
                    .addField(res.site_admin && 'Admin'),
            });
        }
        case 'repository': {
            const res = await msg.client.github.fetchRepo(args[0]);
            if (!res) return msg.channel.send('Repository not found.');
            return msg.channel.send({
                embed: msg.client.util
                    .embed()
                    .setTitle(res.full_name)
                    .setColor('RANDOM')
                    .setURL(res.html_url)
                    .setThumbnail(res.owner.avatar_url)
                    .setDescription(res.description)
                    .addField('Data', `Default branch: \`${res.default_branch}\`
License: ${res.license ? `[${res.license.name}](${res.license.url})` : 'None'}
Language: ${res.language || 'None'}
Created at: ${new Date(res.created_at).toDateString()}
Updated at: ${new Date(res.updated_at).toDateString()}
Pushed at: ${new Date(res.pushed_at).toDateString()}
${(<(keyof typeof res)[]>['fork', 'archived', 'disabled']).map(s => res[s] ? msg.client.util.capitalize(s) : '').join('\n')}`)
                    .addField('Stats', `Stars: ${f(res.stargazers_count)}\nWatchers: ${f(res.subscribers_count)}\nForks: ${f(res.forks_count)}\nOpen issues: ${f(res.open_issues_count)}`),
            });
        }
        }
    }
};