import { MessageEmbed, MessageEmbedOptions } from 'discord.js';

export default class extends MessageEmbed {
    constructor(private inline: boolean, private bulletPoints: boolean, d?: MessageEmbedOptions) {
        super(d);
    }
    public addField(title: string | boolean = '\u200b', desc: string | number = '\u200b', inline = this.inline, bulletPoints = this.bulletPoints) {
        if (title) super.addField(
            `${bulletPoints ? '❯ ' : ''}${title}`,
            `${desc}`
                .split('\n')
                .map(x => `${bulletPoints && !x.startsWith('>') && x.trim() && x !== '\u200b' ? '• ' : ''}${x}`)
                .join('\n'),
            inline,
        );
        return this;
    }
    public setThumbnail(s?: string) {
        if (s) super.setThumbnail(s);
        return this;
    }
}