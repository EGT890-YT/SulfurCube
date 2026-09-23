import {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { getGuildConfig } from '../../services/config/guildConfig.js';
import {
  addYouTubeNotification,
  resolveYouTubeChannel,
  MAX_SUBSCRIPTIONS,
} from '../../services/youtubeNotifyService.js';

function normalizePing(input, guild) {
  const value = String(input || '').trim();
  if (value === '@everyone' || value === '@here') return value;
  const roleMatch = value.match(/^<@&(\d+)>$/);
  if (roleMatch) {
    if (!guild.roles.cache.has(roleMatch[1])) throw new Error('That role could not be found in this server.');
    return value;
  }
  const userMatch = value.match(/^<@!?(\d+)>$/);
  if (userMatch) {
    if (!guild.members.cache.has(userMatch[1])) throw new Error('That member could not be found in this server.');
    return `<@${userMatch[1]}>`;
  }
  throw new Error('Invalid ping. Use @everyone, @here, a role mention, or a user mention.');
}

export default {
  data: new SlashCommandBuilder()
    .setName('notifyupload')
    .setDescription('Set up YouTube upload notifications in this server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option => option.setName('ping').setDescription('Who should be pinged? @everyone, @here, a role, or a person.').setRequired(true))
    .addStringOption(option => option.setName('youtube_channel').setDescription('YouTube handle, e.g. @example or youtube.com/@example').setRequired(true))
    .addChannelOption(option => option.setName('channel').setDescription('Discord channel where the notification will be sent.').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true))
    .addStringOption(option => option.setName('type').setDescription('What should be announced?').setRequired(true).addChoices(
      { name: 'Live Streams', value: 'live' },
      { name: 'Long-form Videos', value: 'longform' },
      { name: 'Shorts', value: 'shorts' },
      { name: 'All 3 Types', value: 'all' },
    )),
  category: 'Utility',
  async execute(interaction, config, client) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: '❌ You need **Manage Server** to configure YouTube notifications.', ephemeral: true });
    }

    const ping = normalizePing(interaction.options.getString('ping', true), interaction.guild);
    const youtubeInput = interaction.options.getString('youtube_channel', true);
    const discordChannel = interaction.options.getChannel('channel', true);
    const type = interaction.options.getString('type', true);

    try {
      const guildConfig = await getGuildConfig(client, interaction.guild.id);
      const current = Array.isArray(guildConfig.notifyUploads) ? guildConfig.notifyUploads : [];

      if (current.length >= MAX_SUBSCRIPTIONS) {
        return interaction.reply({
          content: `❌ This server already has **${MAX_SUBSCRIPTIONS}/${MAX_SUBSCRIPTIONS}** YouTube notification configurations. Remove one with **/removeupload** to add another.`,
          ephemeral: true,
        });
      }

      const youtube = await resolveYouTubeChannel(youtubeInput);
      const me = interaction.guild.members.me;
      const permissions = me ? discordChannel.permissionsFor(me) : null;
      if (!permissions?.has(PermissionFlagsBits.ViewChannel) || !permissions?.has(PermissionFlagsBits.SendMessages) || !permissions?.has(PermissionFlagsBits.EmbedLinks)) {
        return interaction.reply({ content: `❌ I need **View Channel**, **Send Messages**, and **Embed Links** in ${discordChannel}.`, ephemeral: true });
      }

      const total = await addYouTubeNotification(client, interaction.guild.id, {
        ping,
        youtubeHandle: youtube.handle,
        youtubeChannelId: youtube.channelId,
        youtubeChannelName: youtube.name,
        channelId: discordChannel.id,
        type,
      });

      const typeLabel = { live: 'Live Streams', longform: 'Long-form Videos', shorts: 'Shorts', all: 'All 3 Types' }[type];
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('✅ YouTube notifications configured')
        .setDescription(`SulfurCube will now announce **${typeLabel}** from **${youtube.name}** in ${discordChannel}.`)
        .addFields(
          { name: 'Ping', value: ping, inline: true },
          { name: 'YouTube', value: youtube.handle, inline: true },
          { name: 'Type', value: typeLabel, inline: true },
          { name: 'Slot', value: `${total}/${MAX_SUBSCRIPTIONS}`, inline: true },
        )
        .setFooter({ text: 'SulfurCube • YouTube Notifications' });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      return interaction.reply({ content: `❌ ${error.message || 'Failed to configure YouTube notifications.'}`, ephemeral: true });
    }
  },
};