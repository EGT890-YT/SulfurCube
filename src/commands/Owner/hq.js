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

const PAGE_SIZE = 25;
const HQ_CUSTOM_ID_PREFIX = 'hq';

function safeText(value, fallback = 'Unnamed Server', maxLength = 100) {
  const text = String(value ?? fallback)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (text || fallback).slice(0, maxLength);
}

function getGuilds(client) {
  return [...client.guilds.cache.values()].sort((a, b) =>
    safeText(a.name, 'Unnamed Server').localeCompare(safeText(b.name, 'Unnamed Server'))
  );
}

function clampPage(page, guildCount) {
  const maxPage = Math.max(0, Math.ceil(guildCount / PAGE_SIZE) - 1);
  return Math.min(Math.max(Number(page) || 0, 0), maxPage);
}

function buildPanel(client, selectedGuildId = null, requestedPage = 0) {
  const guilds = getGuilds(client);
  const page = clampPage(requestedPage, guilds.length);
  const totalPages = Math.max(1, Math.ceil(guilds.length / PAGE_SIZE));
  const pageGuilds = guilds.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const selectedGuild = guilds.find((guild) => guild.id === selectedGuildId) ?? pageGuilds[0] ?? null;

  const embed = new EmbedBuilder()
    .setTitle('🛠️ SulfurCube HQ')
    .setDescription(
      `**Soverign SMP** is the bot HQ.\n\n` +
      `Servers: **${guilds.length}** • Page **${page + 1}/${totalPages}**\n` +
      `Selected: **${safeText(selectedGuild?.name, 'None selected')}**`
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

  const select = new StringSelectMenuBuilder()
    .setCustomId(`${HQ_CUSTOM_ID_PREFIX}:guild`)
    .setPlaceholder('Select a server')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      pageGuilds.length
        ? pageGuilds.map((guild) => ({
            label: safeText(guild.name),
            value: String(guild.id),
            description: safeText(`ID: ${guild.id}`, 'Server', 100),
            default: guild.id === selectedGuild?.id,
          }))
        : [{
            label: 'No servers available',
            value: 'none',
            description: 'No servers are currently available.',
          }],
    );

  const navigation = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${HQ_CUSTOM_ID_PREFIX}:page:${Math.max(0, page - 1)}`)
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`${HQ_CUSTOM_ID_PREFIX}:page:${Math.min(totalPages - 1, page + 1)}`)
      .setLabel('Next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId(`${HQ_CUSTOM_ID_PREFIX}:refresh:${page}`)
      .setLabel('Refresh')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`${HQ_CUSTOM_ID_PREFIX}:owner-role`)
      .setLabel('Owner Role')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${HQ_CUSTOM_ID_PREFIX}:invite`)
      .setLabel('Invite')
      .setStyle(ButtonStyle.Secondary),
  );

  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${HQ_CUSTOM_ID_PREFIX}:server:on`)
      .setLabel('Server ON')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`${HQ_CUSTOM_ID_PREFIX}:server:off`)
      .setLabel('Server OFF')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`${HQ_CUSTOM_ID_PREFIX}:bots:on`)
      .setLabel('All Bots ON')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`${HQ_CUSTOM_ID_PREFIX}:maintenance:on`)
      .setLabel('Maintenance ON')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`${HQ_CUSTOM_ID_PREFIX}:maintenance:off`)
      .setLabel('Maintenance OFF')
      .setStyle(ButtonStyle.Success),
  );

  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${HQ_CUSTOM_ID_PREFIX}:testing`)
      .setLabel('Testing Mode')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${HQ_CUSTOM_ID_PREFIX}:message`)
      .setLabel('Message')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`${HQ_CUSTOM_ID_PREFIX}:leave`)
      .setLabel('Leave')
      .setStyle(ButtonStyle.Danger),
  );

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(select),
      navigation,
      controls,
      actions,
    ],
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
