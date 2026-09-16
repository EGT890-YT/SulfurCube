import { EmbedBuilder } from 'discord.js';

export default {
  name: 'honeypot_info',
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('🍯 Why is this channel here?')
      .setDescription(
        '**botboi is a honeypot channel.**\n\n' +
        'Normal members should have absolutely no reason to type here. The channel exists to catch spam, raid accounts and unwanted bots that automatically post in channels they discover.\n\n' +
        '### 🚨 What happens if I type here?\n' +
        'If you are **not an Administrator**, SulfurCube will treat your message as a honeypot trigger and attempt to permanently ban you while deleting your recent messages.\n\n' +
        '### 👑 Administrators\n' +
        'Members with the **Administrator** permission are exempt and can use this channel normally.\n\n' +
        '**If you are not an admin: DO NOT TYPE HERE.**'
      )
      .setFooter({ text: 'SulfurCube Honeypot' });

    return interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
