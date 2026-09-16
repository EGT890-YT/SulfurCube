import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { assertHQOwner, HQ_GUILD_ID } from '../../config/owner.js';
import botConfig from '../../config/bot.js';

function safeComponentText(value, fallback = 'Unnamed Server', maxLength = 100) {
  const cleaned = String(value ?? '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  const chars = Array.from(cleaned).slice(0, maxLength).join('').trim();
  return chars || fallback;
}

function buildPanel(client, selectedGuildId = null, requestedPage = 0) {
  const guilds = [...client.guilds.cache.values()].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''))
  );
  const pageCount = Math.max(1, Math.ceil(guilds.length / 25));
  const page = Math.min(Math.max(Number(requestedPage) || 0, 0), pageCount - 1);
  const pageGuilds = guilds.slice(page * 25, page * 25 + 25);
  const selected = selectedGuildId
    ? client.guilds.cache.get(selectedGuildId)
    : pageGuilds[0] ?? guilds[0];
  const selectedOnPage = selected ? pageGuilds.some((guild) => guild.id === selected.id) : false;

  const options = pageGuilds.map((guild) => ({
    label: safeComponentText(guild.name, 'Unnamed Server', 100),
    value: String(guild.id),
    description: safeComponentText(`${guild.memberCount ?? 0} members - ${guild.id}`, 'Server', 100),
    ...(selectedOnPage && guild.id === selected?.id ? { default: true } : {}),
  }));

  const selectedName = selected
    ? safeComponentText(selected.name, 'Unnamed Server', 100)
    : null;

  const embed = new EmbedBuilder()
    .setTitle('🛠️ SulfurCube HQ')
    .setDescription(
      `**Soverign SMP** is the bot HQ.\n\n` +
      `Servers the bot is currently in: **${guilds.length}**\n` +
      `Page **${page + 1}/${pageCount}**` +
      (selected
        ? `\n\n**Selected:** ${selectedName}\nID: ${selected.id}`
        : '\n\nNo guild is currently available.')
    )
    .addFields(
      {
        name: 'Global Bot State',
        value: `${botConfig.commands.maintenanceMode ? '🛠️ Maintenance ON' : '🟢 Maintenance OFF'}\n${botConfig.commands.testingMode ? '🧪 Testing ON' : '⚪ Testing OFF'}`,
        inline: true,
      },
      {
        name: 'Selected Server',
        value: selected ? (selected.id === HQ_GUILD_ID ? '👑 HQ server' : 'Server selected') : 'None',
        inline: true,
      },
    )
    .setColor('#5865F2');

  if (options.length === 0) {
    return { embeds: [embed], components: [] };
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId('hq_guild')
    .setPlaceholder('Select a guild...')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(options);

  const selectedId = selected?.id ?? 'none';

  const navigation = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`hq_page:${Math.max(0, page - 1)}:${selectedId}`)
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`hq_page:${Math.min(pageCount - 1, page + 1)}:${selectedId}`)
      .setLabel('Next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= pageCount - 1),
    new ButtonBuilder()
      .setCustomId(`hq_refresh:${page}:${selectedId}`)
      .setLabel('Refresh')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`hq_ownerrole:${selectedId}`)
      .setLabel('Owner Role')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('hq_invite')
      .setLabel('Invite')
      .setStyle(ButtonStyle.Secondary),
  );

  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`hq_server_on:${selectedId}`)
      .setLabel('Server ON')
      .setStyle(ButtonStyle.Success)
      .setDisabled(!selected),
    new ButtonBuilder()
      .setCustomId(`hq_server_off:${selectedId}`)
      .setLabel('Server OFF')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!selected || selected.id === HQ_GUILD_ID),
    new ButtonBuilder()
      .setCustomId('hq_all_on')
      .setLabel('All Bots ON')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('hq_maintenance_on')
      .setLabel('Maintenance ON')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('hq_maintenance_off')
      .setLabel('Maintenance OFF')
      .setStyle(ButtonStyle.Secondary),
  );

  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('hq_testing')
      .setLabel('Testing Mode')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`hq_message:${selectedId}`)
      .setLabel('Message')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!selected),
    new ButtonBuilder()
      .setCustomId(`hq_leave:${selectedId}:${page}`)
      .setLabel('Leave')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!selected || selected.id === HQ_GUILD_ID),
  );

  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(select), navigation, controls, actions],
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

    // Prefix commands use a normal channel message. Slash /hq remains ephemeral.
    const panel = buildPanel(client);
    return interaction.reply({
      ...panel,
      ...(interaction._isPrefixCommand ? {} : { ephemeral: true }),
    });
  },
};
