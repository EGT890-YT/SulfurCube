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
import { getGuildConfig } from '../../services/config/guildConfig.js';

function buildPanel(client, selectedGuildId = null, requestedPage = 0) {
  const guilds = [...client.guilds.cache.values()].sort((a, b) => a.name.localeCompare(b.name));
  const pageCount = Math.max(1, Math.ceil(guilds.length / 25));
  const page = Math.min(Math.max(Number(requestedPage) || 0, 0), pageCount - 1);
  const pageGuilds = guilds.slice(page * 25, page * 25 + 25);
  const selected = selectedGuildId ? client.guilds.cache.get(selectedGuildId) : pageGuilds[0] ?? guilds[0];

  const options = pageGuilds.map((guild) => ({
    label: guild.name.slice(0, 100),
    value: guild.id,
    description: `${guild.memberCount ?? 0} members • ${guild.id}`.slice(0, 100),
    default: guild.id === selected?.id,
  }));

  const embed = new EmbedBuilder()
    .setTitle('🛠️ SulfurCube HQ')
    .setDescription(
      `**Soverign SMP** is the bot HQ.\n\n` +
      `Servers the bot is currently in: **${guilds.length}**\n` +
      `Page **${page + 1}/${pageCount}**` +
      (selected ? `\n\n**Selected:** ${selected.name}\nID: ${selected.id}` : '\n\nNo guild is currently available.')
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

  if (options.length === 0) return { embeds: [embed], components: [] };

  const select = new StringSelectMenuBuilder()
    .setCustomId('hq_guild')
    .setPlaceholder('Select a guild...')
    .addOptions(options);

  const navigation = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`hq_page:${Math.max(0, page - 1)}:${selected?.id ?? 'none'}`).setLabel('Previous').setStyle(ButtonStyle.Secondary).setEmoji('⬅️').setDisabled(page === 0),
    new ButtonBuilder().setCustomId(`hq_page:${Math.min(pageCount - 1, page + 1)}:${selected?.id ?? 'none'}`).setLabel('Next').setStyle(ButtonStyle.Secondary).setEmoji('➡️').setDisabled(page >= pageCount - 1),
    new ButtonBuilder().setCustomId(`hq_refresh:${page}:${selected?.id ?? 'none'}`).setLabel('Refresh').setStyle(ButtonStyle.Secondary).setEmoji('🔄'),
    new ButtonBuilder().setCustomId(`hq_ownerrole:${selected?.id ?? 'none'}`).setLabel('Owner Role').setStyle(ButtonStyle.Success).setEmoji('👑'),
    new ButtonBuilder().setCustomId('hq_invite').setLabel('Invite').setStyle(ButtonStyle.Secondary).setEmoji('🔗'),
  );

  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`hq_server_on:${selected?.id ?? 'none'}`).setLabel('Server ON').setStyle(ButtonStyle.Success).setEmoji('🟢').setDisabled(!selected),
    new ButtonBuilder().setCustomId(`hq_server_off:${selected?.id ?? 'none'}`).setLabel('Server OFF').setStyle(ButtonStyle.Danger).setEmoji('🔴').setDisabled(!selected || selected.id === HQ_GUILD_ID),
    new ButtonBuilder().setCustomId('hq_all_on').setLabel('All Bots ON').setStyle(ButtonStyle.Success).setEmoji('✅'),
    new ButtonBuilder().setCustomId('hq_maintenance_on').setLabel('Maintenance ON').setStyle(ButtonStyle.Danger).setEmoji('🛠️'),
    new ButtonBuilder().setCustomId('hq_maintenance_off').setLabel('Maintenance OFF').setStyle(ButtonStyle.Secondary).setEmoji('🔧'),
  );

  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('hq_testing').setLabel('Testing Mode').setStyle(ButtonStyle.Primary).setEmoji('🧪'),
    new ButtonBuilder().setCustomId(`hq_message:${selected?.id ?? 'none'}`).setLabel('Message').setStyle(ButtonStyle.Primary).setEmoji('💬').setDisabled(!selected),
    new ButtonBuilder().setCustomId(`hq_leave:${selected?.id ?? 'none'}:${page}`).setLabel('Leave').setStyle(ButtonStyle.Danger).setEmoji('🚪').setDisabled(!selected || selected.id === HQ_GUILD_ID),
  );

  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(select), navigation, controls, actions] };
}

export function createHqPanel(client, selectedGuildId = null, page = 0) {
  return buildPanel(client, selectedGuildId, page);
}

export default {
  data: new SlashCommandBuilder().setName('hq').setDescription('SulfurCube owner HQ panel.').setDefaultMemberPermissions('0'),
  category: 'Owner',
  hqOnly: true,
  async execute(interaction, config, client) {
    if (!assertHQOwner(interaction)) {
      return interaction.reply({
        content: '❌ This command is only available to the bot owner in the SulfurCube HQ.',
        ephemeral: !interaction._isPrefixCommand,
      });
    }

    // Prefix commands cannot send ephemeral/component-interaction responses.
    // s?hq therefore posts the panel normally in the HQ channel, while every
    // button/select handler independently verifies the bot owner.
    return interaction.reply({
      ...buildPanel(client),
      ...(interaction._isPrefixCommand ? {} : { ephemeral: true }),
    });
  },
};
