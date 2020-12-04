import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';

const copypasta = 'I was only {{years}} years old. I loved {{name}} so much, I had all the merchandise and movies. I\'d pray to {{name}} every night before I go to bed, thanking for the life I\'ve been given. "{{name}} is love", I would say, "{{name}} is life". My dad hears me and calls me a faggot. I knew he was just jealous for my devotion of {{name}}. I called him a cunt. He slaps me and sends me to go to sleep. I\'m crying now and my face hurts. I lay in bed and it\'s really cold. A warmth is moving towards me. I feel something touch me. It\'s {{name}}. I\'m so happy. {{prou}} whispers in my ear, "This is my {{place}}". {{prou}} grabs me with {{prop}} powerful {{type}} hands, and puts me on my hands and knees. I spread my ass-cheeks for {{name}}. {{prou}} penetrates my butthole. It hurts so much, but I do it for {{name}}. I can feel my butt tearing as my eyes start to water. I push against {{prop}} force. I want to please {{name}}. {{prou}} roars a mighty roar, as {{prol}} fills my butt with {{prop}} love. My dad walks in. {{name}} looks him straight in the eye, and says, "It\'s all {{type}} now". {{name}} leaves through my window. {{name}} is love. {{name}} is life.';
const pronouns: Record<string, string> = {
    he: 'his',
    she: 'her',
    they: 'their',
};

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'text',
        desc: 'Replace some words in the "Shrek is love, shrek is live" copypasta.',
        args: {
            '[name]': 'The name to replace. Defaults to "Shrek".',
        },
        flags: {
            age: 'The age to replace. Defaults to "nine".',
            type: 'The type to replace. Defaults to "ogre".',
            place: 'The place to replace. Defaults to "swamp".',
            pronoun: 'The pronoun to use. Defaults to "he"',
        },
        examples: ['gaben --age=12', 'yandere dev'],
    };
    constructor() {
        super({
            name: 'shrek',
            aliases: ['shrekislove', 'shrekislife'],
        });
    }

    public async fn(msg: Message, { text, flags }: CommandInfo) {
        const pronoun = <string>flags.pronoun || 'he';
        msg.client.util.hasteMessage(msg, (
            flags.n
                ? copypasta.split(/\.\s*/g).join('.\n')
                : flags.gt
                    ? ['', ...copypasta.split(/\.\s*/g).slice(0, -1)].join('\n>\u200b ')
                    : copypasta
        )
            .replace(/\{\{years\}\}/g, <string>flags.age || 'nine')
            .replace(/\{\{name\}\}/g, text || 'Shrek')
            .replace(/\{\{type\}\}/g, <string>flags.type || 'ogre')
            .replace(/\{\{place\}\}/g, <string>flags.place || 'swamp')
            .replace(/\{\{prou\}\}/g, msg.client.util.capitalize(pronoun))
            .replace(/\{\{prol\}\}/g, pronoun.toLowerCase())
            .replace(/\{\{prop\}\}/g, pronouns[pronoun.toLowerCase()] || pronoun)
        );
    }
};