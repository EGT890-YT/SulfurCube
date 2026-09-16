import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { getGuildConfig, updateGuildConfig } from '../../services/config/guildConfig.js';

const HONEYPOT_CHANNEL_NAME = 'botboi';

function buildHoneypotEmbed() {
  return new EmbedBuilder()
    .setColor('#ED4245')
    .setTitle('🚨🚨🚨 DO NOT TYPE HERE 🚨🚨🚨')
    .setDescription(
      '# ⛔ DO NOT TYPE HERE ⛔\n\n' +
      'This channel is a **honeypot** used to catch spam and malicious bots.\n\n' +
      'If you are a normal member, **do not send any message in this channel**.\n\n' +
      'Admins are allowed to use this channel normally. Everyone else who types here will be automatically handled by SulfurCube.'
    )
    .addFields({
      name: '🍯 What is a honeypot?',
      value: 'It is a trap channel. Legitimate members have no reason to post here, so messages can be treated as a strong signal that an account is unwanted.',
    })
    .setFooter({ text: 'SulfurCube Honeypot • Channel: botboi' });
}

function buildHoneypotComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('honeypot_info')
        .setLabel('Why is this here?')
        .setEmoji('🍯')
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

export default {
  data: new SlashCommandBuilder()
    .setName('botboi')
    .setDescription('Create or manage the botboi anti-spam honeypot.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('Create the botboi honeypot channel.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove the configured botboi honeypot channel.')
    ),
  category: 'Moderation',

  async execute(interaction, config, client) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ You need the Administrator permission to manage the botboi honeypot.',
        ephemeral: true,
      });
    }

    const subcommand = interaction.options.getSubcommand();
    const guildConfig = await getGuildConfig(client, interaction.guild.id);

    if (subcommand === 'setup') {
      const existingId = guildConfig?.honeypot?.channelId;
      const existingChannel = existingId
        ? interaction.guild.channels.cache.get(existingId) ?? await interaction.guild.channels.fetch(existingId).catch(() => null)
        : null;

      if (existingChannel) {
        return interaction.reply({
          content: `🍯 The botboi honeypot is already set up: ${existingChannel}.`,
          ephemeral: true,
        });
      }

      const channel = await interaction.guild.channels.create({
        name: HONEYPOT_CHANNEL_NAME,
        type: ChannelType.GuildText,
        topic: '🍯 SulfurCube botboi honeypot — DO NOT TYPE HERE.',
        reason: 'SulfurCube botboi honeypot setup',
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
          },
          {
            id: client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages,
              PermissionFlagsBits.BanMembers,
            ],
          },
        ],
      });

      await updateGuildConfig(client, interaction.guild.id, {
        honeypot: {
          enabled: true,
          channelId: channel.id,
        },
      });

      await channel.send({
        embeds: [buildHoneypotEmbed()],
        components: buildHoneypotComponents(),
      });

      return interaction.reply({
        content: `🍯 Botboi honeypot created: ${channel}\n**Channel name:** \`botboi\``,
        ephemeral: true,
      });
    }

    if (subcommand === 'remove') {
      const channelId = guildConfig?.honeypot?.channelId;
      const channel = channelId
        ? interaction.guild.channels.cache.get(channelId) ?? await interaction.guild.channels.fetch(channelId).catch(() => null)
        : null;

      await updateGuildConfig(client, interaction.guild.id, {
        honeypot: {
          enabled: false,
          channelId: null,
        },
      });

      if (channel) {
        await channel.delete('SulfurCube botboi honeypot removed').catch(() => {});
      }

      return interaction.reply({
        content: '🍯 Botboi honeypot removed.',
        ephemeral: true,
      });
    }
  },
};
