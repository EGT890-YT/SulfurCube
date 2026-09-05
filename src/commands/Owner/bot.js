import { SlashCommandBuilder } from 'discord.js';
import botConfig from '../../config/bot.js';
import { isBotOwner } from '../../config/owner.js';
import { getGuildConfig, updateGuildConfig } from '../../services/config/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bot')
    .setDescription('Owner-only bot controls.')
    .addSubcommand((sub) =>
      sub
        .setName('on')
        .setDescription('Turn SulfurCube on in this server, or all servers.')
        .addStringOption((option) =>
          option.setName('scope').setDescription('Choose whether to enable this server or every server.')
            .setRequired(false)
            .addChoices({ name: 'This server', value: 'server' }, { name: 'All servers', value: 'all' }),
        ),
    )
    .addSubcommand((sub) => sub.setName('off').setDescription('Disable SulfurCube in this server only.'))
    .addSubcommand((sub) => sub.setName('maintenance').setDescription('Put SulfurCube into server-wide maintenance mode.'))
    .addSubcommand((sub) => sub.setName('testing').setDescription('Enable testing mode while maintenance is active.'))
    .addSubcommand((sub) => sub.setName('status').setDescription('Show the current bot status.'))
    .setDefaultMemberPermissions('0'),

  category: 'Owner',

  async execute(interaction, config, client) {
    if (!isBotOwner(interaction.user.id, client)) {
      return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
    }

    const action = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (action === 'off') {
      if (!guildId) return interaction.reply({ content: '❌ `/bot off` can only be used inside a server.', ephemeral: true });
      await updateGuildConfig(client, guildId, { botDisabled: true }, { source: 'owner.bot.off', userId: interaction.user.id });
      return interaction.reply({ content: `🔴 **SulfurCube is now OFF in ${interaction.guild.name}.**\n\nOther servers are unaffected. Use \`/bot on\` to turn it back on here.`, ephemeral: true });
    }

    if (action === 'maintenance') {
      botConfig.commands.maintenanceMode = true;
      botConfig.commands.testingMode = false;
      return interaction.reply({ content: '🛠️ **SulfurCube is now in maintenance mode.**\n\nThe bot is unavailable to normal users server-wide. Owner controls remain available.', ephemeral: true });
    }

    if (action === 'testing') {
      if (botConfig.commands.maintenanceMode !== true) {
        return interaction.reply({ content: '❌ **Testing mode is only available while maintenance mode is active.**\n\nRun `/bot maintenance` first.', ephemeral: true });
      }
      botConfig.commands.maintenanceMode = false;
      botConfig.commands.testingMode = true;
      return interaction.reply({ content: '🧪 **SulfurCube is now in testing mode.**\n\nNormal commands are available again for testing. Use `/bot on` with **All servers** to fully restore everything.', ephemeral: true });
    }

    if (action === 'on') {
      const scope = interaction.options.getString('scope') || 'server';
      if (scope === 'all') {
        botConfig.commands.maintenanceMode = false;
        botConfig.commands.testingMode = false;
        const updates = [...client.guilds.cache.values()].map((guild) => updateGuildConfig(client, guild.id, { botDisabled: false }, { source: 'owner.bot.on.all', userId: interaction.user.id }).catch(() => null));
        await Promise.all(updates);
        return interaction.reply({ content: `🟢 **SulfurCube is now ON in all ${client.guilds.cache.size} server(s).**\n\nMaintenance, testing mode, and all per-server shutdowns have been cleared.`, ephemeral: true });
      }
      if (!guildId) return interaction.reply({ content: '❌ `/bot on` can only enable a single server when used inside a server. Use the **All servers** option from a server context.', ephemeral: true });
      await updateGuildConfig(client, guildId, { botDisabled: false }, { source: 'owner.bot.on.server', userId: interaction.user.id });
      return interaction.reply({ content: `🟢 **SulfurCube is now ON in ${interaction.guild.name}.**\n\nOther servers are unaffected.`, ephemeral: true });
    }

    const currentGuildConfig = guildId ? await getGuildConfig(client, guildId, { source: 'owner.bot.status' }) : null;
    const maintenance = botConfig.commands.maintenanceMode === true;
    const testing = botConfig.commands.testingMode === true;
    const serverOff = currentGuildConfig?.botDisabled === true;

    return interaction.reply({
      content: `**SulfurCube Status**\n\n${serverOff ? '🔴' : '🟢'} **This server:** ${serverOff ? 'OFF' : 'ON'}\n${maintenance ? '🛠️' : '🟢'} **Maintenance:** ${maintenance ? 'ON' : 'OFF'}\n${testing ? '🧪' : '⚪'} **Testing:** ${testing ? 'ON' : 'OFF'}`,
      ephemeral: true,
    });
  },
};
