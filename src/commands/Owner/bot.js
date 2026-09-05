import { SlashCommandBuilder } from 'discord.js';
import botConfig from '../../config/bot.js';
import { isBotOwner } from '../../config/owner.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bot')
    .setDescription('Owner-only bot controls.')
    .addSubcommand((sub) => sub.setName('on').setDescription('Turn the bot on.'))
    .addSubcommand((sub) => sub.setName('off').setDescription('Put the bot into maintenance mode.'))
    .addSubcommand((sub) => sub.setName('status').setDescription('Show the current bot status.'))
    .setDefaultMemberPermissions('0'),

  category: 'Owner',

  async execute(interaction) {
    if (!isBotOwner(interaction.user.id)) {
      return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
    }

    const action = interaction.options.getSubcommand();

    if (action === 'on') {
      botConfig.commands.maintenanceMode = false;
      return interaction.reply({ content: '🟢 **SulfurCube is now ON.**', ephemeral: true });
    }

    if (action === 'off') {
      botConfig.commands.maintenanceMode = true;
      return interaction.reply({ content: '🔴 **SulfurCube is now OFF.** All non-owner commands are locked.', ephemeral: true });
    }

    return interaction.reply({
      content: botConfig.commands.maintenanceMode
        ? '🔴 **SulfurCube is OFF** (maintenance mode).'
        : '🟢 **SulfurCube is ON**.',
      ephemeral: true,
    });
  },
};
