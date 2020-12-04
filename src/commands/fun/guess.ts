import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';

const responses = (x: number, y: number) => [
    'Are you really that bad?',
    'It\'s not that hard, is it?',
    x ? 'Not even close.' : 'Maybe next time. Oh, guess not.',
    x && y ? 'Have you thought of using a hint?' : 'Incorrect, you can still use a hint though. Oh, guess not.',
];

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'fun',
        desc: 'A number guessing game.',
        args: {
            '[min]': 'The minimum number.',
            '[max]': 'The maximum number.',
            '[guesses]': 'The amount of guesses.',
            '[hints]': 'The amount of hints.',
        },
    };
    constructor() {
        super({
            name: 'guess',
        });
    }

    public async fn(msg: Message, { args: [min, max, guessS, hintS] }: CommandInfo) {
        const n = msg.client.util.random(+min || 1, +max || 10);
        const initialGuesses = +guessS || 3;
        const initialHints = +hintS || 1;
        let guesses = initialGuesses;
        let hints = initialHints;
        let last: number;
        await msg.channel.send(`Alright, you have ${guesses} guesses to guess the number I thought of between ${+min || 1} and ${+max || 10}.\nYou can also type \`hint\` to use a hint (total: ${hints}), or \`surrender\` to stop.`);
        const collector = msg.channel
            .createMessageCollector((m: Message) => m.author.id === msg.author.id)
            .on('collect', (m: Message) => {
                const content = m.content.toLowerCase();
                if (content.startsWith('hint')) {
                    if (isNaN(last)) return m.channel.send(`You should probably take a guess first. ${guesses} guesses, ${hints} hints remaining.`);
                    if (!hints) return m.channel.send(`You don\'t have any hints remaining. ${guesses} guesses remaining.`);
                    return m.channel.send(`The last number you guessed was too ${last > n ? 'high' : 'low'}. ${guesses} guesses, ${--hints} hints remaining.`);
                }
                if (content.startsWith('surrender')) {
                    collector.stop();
                    return m.channel.send(`Are you seriously that bad? The number was ${n}, you had ${guesses} guesses, ${hints} hints remaining.`);
                }
                const x = +content.match(/\d+/)?.[0]!;
                if (!isNaN(x)) {
                    if (x === n) {
                        collector.stop();
                        return m.channel.send(`Congrats, only took ${initialGuesses - guesses--} guesses and ${initialHints - hints} hints I guess.`);
                    }
                    const randomMsg = msg.client.util.random(responses(--guesses, hints));
                    if (!guesses) {
                        collector.stop();
                        return m.channel.send(`${randomMsg} You ran out of guesses. The number was ${n}.`);
                    }
                    last = x;
                    m.channel.send(`${randomMsg} ${guesses} guesses, ${hints} hints remaining.`);
                }
            });
    }
};