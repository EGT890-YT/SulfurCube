import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { assertHQOwner } from '../../config/owner.js';
import botConfig from '../../config/bot.js';

function buildPanel(client) {
  const guilds = [...client.guilds.cache.values()].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''))
  );

  const lines = guilds.length
    ? guilds.map((guild, index) => `${index + 1}. **${String(guild.name || 'Unnamed Server').replace(/[\r\n]/g, ' ')}** — ${guild.id}`)
    : ['No guilds found.'];

  const embed = new EmbedBuilder()
    .setTitle('🛠️ SulfurCube HQ')
    .setDescription(
      `**Soverign SMP** is the bot HQ.\n\n` +
      `Servers the bot is currently in: **${guilds.length}**\n\n` +
      lines.slice(0, 25).join('\n')
    )
    .addFields(
      {
        name: 'Global Bot State',
        value: `${botConfig.commands.maintenanceMode ? '🛠️ Maintenance ON' : '🟢 Maintenance OFF'}\n${botConfig.commands.testingMode ? '🧪 Testing ON' : '⚪ Testing OFF'}`,
        inline: true,
      },
      {
        name: 'HQ',
        value: '👑 Soverign SMP',
        inline: true,
      },
    )
    .setColor('#5865F2');

  return { embeds: [embed] };
}

export function createHqPanel(client) {
  return buildPanel(client);
}

export default {
  data: new SlashCommandBuilder()
    .setName('hq')
    .setDescription('SulfurCube owner HQ panel.')
    .setDefaultMemberPermissions('0'),
  category: 'Owner',
  hqOnly: true,
  async execute(interaction, config, client) {
    if (!assertHQOwner(interaction)) {
      return interaction.reply({
        content: '❌ This command is only available to the bot owner in the SulfurCube HQ.',
        ephemeral: !interaction._isPrefixCommand,
      });
    }

    const panel = buildPanel(client);
    return interaction.reply({
      ...panel,
      ...(interaction._isPrefixCommand ? {} : { ephemeral: true }),
    });
  },
};
