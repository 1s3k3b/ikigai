import { Command } from 'aurora-djs';
import { Message, User, MessageReaction } from 'discord.js';
import fetch from 'node-fetch';
import { Help } from '../../types';
import constants from '../../util/constants';

const abc = 'abcd';
const emojis = ['🇦', '🇧', '🇨', '🇩'];

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'fun',
        desc: 'Get a random trivia question.',
        readme: 13,
    };
    constructor() {
        super({
            name: 'trivia',
        });
    }

    public async fn(msg: Message) {
        const res = <{
            category: string;
            difficulty: string;
            question: string;
            correct_answer: string;
            incorrect_answers: string[];
        }><unknown>await fetch(constants.REST.TRIVIA)
            .then(d => d.json())
            .then(d => Object.fromEntries(
                Object
                    .entries(<Record<string, string | string[]>>d.results[0])
                    .map(([k, v]) => [k, typeof v === 'string' ? decodeURIComponent(v) : v.map(decodeURIComponent)])
            ));
        const arr = [res.correct_answer, ...res.incorrect_answers].sort(() => 0.5 - Math.random());
        const sent = await msg.channel.send('You have 30 seconds to react with the correct letter.', {
            embed: msg.client.util
                .embed(false, false)
                .setTitle(res.question)
                .setColor('RANDOM')
                .setDescription(`Category: ${res.category}\nDifficulty: ${res.difficulty}`)
                .addFields(arr.map((x, i) => ({
                    name: '\u200b',
                    value: `${abc[i]}) ${x}`,
                }))),
        });
        for (const i of arr.keys()) await sent.react(emojis[i]);
        const em = await sent
            .awaitReactions(
                (em: MessageReaction, u: User) => emojis.includes(em.emoji.name) && u.id === msg.author.id,
                {
                    max: 1,
                    time: 30000,
                }
            )
            .then(d => d.first());
        sent.edit('', {
            embed: msg.client.util
                .embed(false, false)
                .setTitle(res.question)
                .setColor(arr[emojis.indexOf(em?.emoji.name || '')] === res.correct_answer ? 'GREEN' : 'RED')
                .setDescription(`Category: ${res.category}\nDifficulty: ${res.difficulty}`)
                .addFields(arr.map((x, i) => ({
                    name: '\u200b',
                    value: `${x === res.correct_answer ? '✅ ' : i === emojis.indexOf(em?.emoji.name || '') ? '❌ ' : ''}${abc[i]}) ${x}`,
                }))),
        });
    }
};