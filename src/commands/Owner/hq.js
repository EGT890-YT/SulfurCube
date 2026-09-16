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

function buildPanel(client, selectedIndex = 0) {
  const guilds = [...client.guilds.cache.values()].sort((a, b) =>
    safeText(a.name).localeCompare(safeText(b.name))
  );

  const index = Math.min(Math.max(selectedIndex, 0), Math.max(guilds.length - 1, 0));
  const selectedGuild = guilds[index] ?? null;

  const embed = new EmbedBuilder()
    .setTitle('🛠️ SulfurCube HQ')
    .setDescription(
      `**Soverign SMP** is the bot HQ.\n\n` +
      `Servers: **${guilds.length}**\n` +
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

  const rows = [];

  if (guilds.length > 0) {
    const options = guilds.slice(0, 25).map((guild, guildIndex) => ({
      label: safeText(guild.name),
      value: guild.id,
      description: `Server ${guildIndex + 1} • ${guild.memberCount ?? '?'} members`.slice(0, 100),
    }));

    rows.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('hq_guild')
          .setPlaceholder('Select a server')
          .addOptions(options),
      ),
    );
  }

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('hq_previous')
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index <= 0),
    new ButtonBuilder()
      .setCustomId('hq_next')
      .setLabel('Next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index >= Math.min(guilds.length - 1, 24)),
    new ButtonBuilder()
      .setCustomId('hq_refresh')
      .setLabel('Refresh')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('hq_owner_role')
      .setLabel('Owner Role')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('hq_invite')
      .setLabel('Invite')
      .setStyle(ButtonStyle.Secondary),
  );

  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('hq_server_on').setLabel('Server ON').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('hq_server_off').setLabel('Server OFF').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('hq_bots_on').setLabel('All Bots ON').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('hq_maintenance_on').setLabel('Maintenance ON').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('hq_maintenance_off').setLabel('Maintenance OFF').setStyle(ButtonStyle.Success),
  );

  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('hq_testing').setLabel('Testing Mode').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('hq_message').setLabel('Message').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('hq_leave').setLabel('Leave').setStyle(ButtonStyle.Danger),
  );

  rows.push(buttons, controls, actions);

  return {
    embeds: [embed],
    components: rows,
  };
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
