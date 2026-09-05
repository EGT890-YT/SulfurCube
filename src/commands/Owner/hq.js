import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { assertHQOwner, BOT_CLIENT_ID, HQ_GUILD_ID } from '../../config/owner.js';

function buildPanel(client, selectedGuildId = null) {
  const guilds = [...client.guilds.cache.values()].sort((a, b) => a.name.localeCompare(b.name));
  const selected = selectedGuildId ? client.guilds.cache.get(selectedGuildId) : guilds[0];
  const options = guilds.slice(0, 25).map((guild) => ({
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
      (selected
        ? `\n**Selected:** ${selected.name}\nID: ${selected.id}`
        : '\nNo guild is currently available.')
    )
    .setColor('#5865F2');

  if (options.length === 0) return { embeds: [embed], components: [] };

  const select = new StringSelectMenuBuilder()
    .setCustomId('hq_guild')
    .setPlaceholder('Select a guild...')
    .addOptions(options);

  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`hq_refresh:${selected?.id ?? 'none'}`).setLabel('Refresh').setStyle(ButtonStyle.Secondary).setEmoji('🔄'),
    new ButtonBuilder().setCustomId(`hq_message:${selected?.id ?? 'none'}`).setLabel('Message').setStyle(ButtonStyle.Primary).setEmoji('💬').setDisabled(!selected),
    new ButtonBuilder().setCustomId(`hq_leave:${selected?.id ?? 'none'}`).setLabel('Leave').setStyle(ButtonStyle.Danger).setEmoji('🚪').setDisabled(!selected || selected.id === HQ_GUILD_ID),
    new ButtonBuilder().setCustomId('hq_ownerrole').setLabel('Owner Role').setStyle(ButtonStyle.Success).setEmoji('👑'),
    new ButtonBuilder().setLabel('Invite').setStyle(ButtonStyle.Link).setEmoji('🔗').setURL(
      `https://discord.com/oauth2/authorize?client_id=${BOT_CLIENT_ID}&scope=bot%20applications.commands&permissions=0`
    )
  );

  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(select), controls] };
}

export function createHqPanel(client, selectedGuildId = null) {
  return buildPanel(client, selectedGuildId);
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
      return interaction.reply({ content: '❌ This command is only available to the bot owner in the SulfurCube HQ.', ephemeral: true });
    }

    return interaction.reply({ ...buildPanel(client), ephemeral: true });
  },
};
