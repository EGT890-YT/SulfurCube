import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { assertHQOwner } from '../../config/owner.js';
import botConfig from '../../config/bot.js';

function safeText(value, fallback = 'Unnamed Server', maxLength = 100) {
  const text = String(value ?? fallback)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (text || fallback).slice(0, maxLength);
}

function buildPanel(client, selectedGuildId = null, page = 0) {
  const guilds = [...client.guilds.cache.values()].sort((a, b) =>
    safeText(a.name).localeCompare(safeText(b.name))
  );

  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(guilds.length / pageSize));
  const currentPage = Math.min(Math.max(Number(page) || 0, 0), pageCount - 1);
  const pageGuilds = guilds.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const selectedGuild = selectedGuildId
    ? client.guilds.cache.get(selectedGuildId) ?? null
    : null;

  const selectedLabel = safeText(selectedGuild?.name, 'None selected');

  const embed = new EmbedBuilder()
    .setTitle('🛠️ SulfurCube HQ')
    .setDescription(
      `**Soverign SMP** is the bot HQ.\n\n` +
      `Servers: **${guilds.length}**\n` +
      `Selected: **${selectedLabel}**\n` +
      `Page: **${currentPage + 1}/${pageCount}**`
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

  if (selectedGuild) {
    embed.addFields({
      name: 'Selected Server',
      value: `**${safeText(selectedGuild.name)}**\nID: \`${selectedGuild.id}\`\nMembers: **${selectedGuild.memberCount ?? 'Unknown'}**`,
    });
  }

  const rows = [];

  if (pageGuilds.length > 0) {
    rows.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('hq_guild')
          .setPlaceholder(selectedGuild ? `🌐 ${safeText(selectedGuild.name, 'Select a server')}` : '🌐 Select a server')
          .addOptions(
            pageGuilds.map((guild) => ({
              label: safeText(guild.name),
              value: guild.id,
              description: `${guild.memberCount ?? '?'} members`.slice(0, 100),
              default: guild.id === selectedGuildId,
            })),
          ),
      ),
    );
  }

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`hq_page:${currentPage - 1}:${selectedGuildId ?? 'none'}`)
      .setLabel('◀️ Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage <= 0),
    new ButtonBuilder()
      .setCustomId(`hq_page:${currentPage + 1}:${selectedGuildId ?? 'none'}`)
      .setLabel('Next ▶️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage >= pageCount - 1),
    new ButtonBuilder()
      .setCustomId(`hq_refresh:${currentPage}:${selectedGuildId ?? 'none'}`)
      .setLabel('🔄 Refresh')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`hq_ownerrole:${selectedGuildId ?? 'none'}`)
      .setLabel('👑 Owner Role')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!selectedGuild),
    new ButtonBuilder()
      .setCustomId('hq_invite')
      .setLabel('🔗 Invite')
      .setStyle(ButtonStyle.Secondary),
  );

  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`hq_server_on:${selectedGuildId ?? 'none'}`)
      .setLabel('🟢 Server ON')
      .setStyle(ButtonStyle.Success)
      .setDisabled(!selectedGuild),
    new ButtonBuilder()
      .setCustomId(`hq_server_off:${selectedGuildId ?? 'none'}`)
      .setLabel('🔴 Server OFF')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!selectedGuild),
    new ButtonBuilder()
      .setCustomId('hq_all_on')
      .setLabel('🤖 All Bots ON')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('hq_maintenance_on')
      .setLabel('🛠️ Maintenance ON')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('hq_maintenance_off')
      .setLabel('🟢 Maintenance OFF')
      .setStyle(ButtonStyle.Success),
  );

  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('hq_testing')
      .setLabel('🧪 Testing Mode')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`hq_message:${selectedGuildId ?? 'none'}`)
      .setLabel('💬 Message')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!selectedGuild),
    new ButtonBuilder()
      .setCustomId(`hq_leave:${selectedGuildId ?? 'none'}:${currentPage}`)
      .setLabel('🚪 Leave')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!selectedGuild || selectedGuildId === null),
  );

  rows.push(buttons, controls, actions);

  return {
    embeds: [embed],
    components: rows,
  };
}

export function createHqPanel(client, selectedGuildId = null, page = 0) {
  return buildPanel(client, selectedGuildId, page);
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
