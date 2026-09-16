import { EmbedBuilder } from 'discord.js';

export default {
  name: 'honeypot_info',
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('❓ Why is this channel here?')
      .setDescription(
        '**botboi is a trapchannel.**\n\n' +
        'This channel is intentionally kept separate from normal conversation and should not be used for regular messages.\n\n' +
        '### 🚨 What happens if I type here?\n' +
        'If you are **not an Administrator**, SulfurCube will automatically handle the message and take the appropriate moderation action.\n\n' +
        '### 👑 Administrators\n' +
        'Members with the **Administrator** permission are exempt and can use this channel normally.\n\n' +
        '**If you are not an admin: DO NOT TYPE HERE.**'
      )
      .setFooter({ text: 'SulfurCube • BotBoi' });

    return interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
