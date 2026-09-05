import { SlashCommandBuilder } from 'discord.js';
import botConfig from '../../config/bot.js';
import { isBotOwner } from '../../config/owner.js';
import { getGuildConfig, updateGuildConfig } from '../../services/config/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bot')
    .setDescription('Owner-only bot controls.')
    .addSubcommand((sub) => sub.setName('on').setDescription('Fully turn SulfurCube back on everywhere.'))
    .addSubcommand((sub) => sub.setName('off').setDescription('Disable SulfurCube in this server only.'))
    .addSubcommand((sub) => sub.setName('maintenance').setDescription('Put SulfurCube into server-wide maintenance mode.'))
    .addSubcommand((sub) => sub.setName('testing').setDescription('Enable testing mode while maintenance is active.'))
    .addSubcommand((sub) => sub.setName('status').setDescription('Show the current bot status.'))
    .setDefaultMemberPermissions('0'),

  category: 'Owner',

  async execute(interaction, config, client) {
    if (!isBotOwner(interaction.user.id)) {
      return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
    }

    const action = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (action === 'off') {
      if (!guildId) {
        return interaction.reply({ content: '❌ `/bot off` can only be used inside a server.', ephemeral: true });
      }

      await updateGuildConfig(client, guildId, { botDisabled: true }, { source: 'owner.bot.off', userId: interaction.user.id });

      return interaction.reply({
        content: `🔴 **SulfurCube is now OFF in ${interaction.guild.name}.**\n\nOther servers are unaffected. Use \`/bot on\` to fully restore the bot everywhere.`,
        ephemeral: true,
      });
    }

    if (action === 'maintenance') {
      botConfig.commands.maintenanceMode = true;
      botConfig.commands.testingMode = false;

      return interaction.reply({
        content: '🛠️ **SulfurCube is now in maintenance mode.**\n\nThe bot is unavailable to normal users server-wide. Owner controls remain available.',
        ephemeral: true,
      });
    }

    if (action === 'testing') {
      if (botConfig.commands.maintenanceMode !== true) {
        return interaction.reply({
          content: '❌ **Testing mode is only available while maintenance mode is active.**\n\nRun `/bot maintenance` first.',
          ephemeral: true,
        });
      }

      // Testing mode takes the bot out of the maintenance command lock while
      // remembering that this is a testing state until /bot on is used.
      botConfig.commands.maintenanceMode = false;
      botConfig.commands.testingMode = true;

      return interaction.reply({
        content: '🧪 **SulfurCube is now in testing mode.**\n\nNormal commands are available again for testing. Use `/bot on` to clear testing mode and fully restore the bot.',
        ephemeral: true,
      });
    }

    if (action === 'on') {
      botConfig.commands.maintenanceMode = false;
      botConfig.commands.testingMode = false;

      // Fully restore every server that was disabled with /bot off.
      const updates = [...client.guilds.cache.values()].map((guild) =>
        updateGuildConfig(client, guild.id, { botDisabled: false }, {
          source: 'owner.bot.on',
          userId: interaction.user.id,
        }).catch(() => null),
      );
      await Promise.all(updates);

      return interaction.reply({
        content: '🟢 **SulfurCube is now fully ON.**\n\nMaintenance, testing mode, and per-server bot shutdowns have all been cleared.',
        ephemeral: true,
      });
    }

    const currentGuildConfig = guildId
      ? await getGuildConfig(client, guildId, { source: 'owner.bot.status' })
      : null;

    const maintenance = botConfig.commands.maintenanceMode === true;
    const testing = botConfig.commands.testingMode === true;
    const serverOff = currentGuildConfig?.botDisabled === true;

    return interaction.reply({
      content:
        `**SulfurCube Status**\n\n` +
        `${serverOff ? '🔴' : '🟢'} **This server:** ${serverOff ? 'OFF' : 'ON'}\n` +
        `${maintenance ? '🛠️' : '🟢'} **Maintenance:** ${maintenance ? 'ON' : 'OFF'}\n` +
        `${testing ? '🧪' : '⚪'} **Testing:** ${testing ? 'ON' : 'OFF'}`,
      ephemeral: true,
    });
  },
};
