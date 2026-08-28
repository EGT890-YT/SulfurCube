
import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

const OWNER_ID = '1281977840648327292';
const BOT_APP_ID = '1541748691063283742';

export default {
  data: new SlashCommandBuilder()
    .setName('nuclearstrike')
    .setDescription('Launch a nuclear strike! ☢️')
    .addUserOption((option) =>
      option
        .setName('person')
        .setDescription('The person you want to nuclear strike.')
        .setRequired(false)
    ),

  category: 'Fun',

  async execute(interaction, config, client) {
    // Only BedrockTechno can use this command
    if (interaction.user.id !== OWNER_ID) {
      const embed = warningEmbed(
        '🚫 Access Denied',
        'You are not authorized to launch a nuclear strike!'
      );

      return await InteractionHelper.safeReply(interaction, {
        embeds: [embed],
        ephemeral: true
      });
    }

    await InteractionHelper.safeDefer(interaction);

    let target = interaction.options.getMember('person');

    // If no person was provided, try to use the person being replied to
    if (!target && interaction.message?.reference?.messageId) {
      try {
        const repliedMessage =
          await interaction.channel.messages.fetch(
            interaction.message.reference.messageId
          );

        if (repliedMessage?.author) {
          target = await interaction.guild.members.fetch(
            repliedMessage.author.id
          );
        }
      } catch (error) {
        console.error('Failed to get replied-to user:', error);
      }
    }

    // No target found
    if (!target) {
      const embed = warningEmbed(
        '☢️ No Target',
        'You need to specify someone to nuclear strike, or use the command while replying to someone!'
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    // Prevent nuclear striking the bot itself
    if (target.user.id === BOT_APP_ID) {
      const embed = warningEmbed(
        '🚫 Target Protected',
        `**${target.user.displayName}** is immune to nuclear strikes. Nice try. 😭`
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    const attackerName =
      interaction.member?.nickname ||
      interaction.user.displayName;

    const targetName =
      target.nickname ||
      target.user.displayName;

    try {
      // Search for nuclear strike GIFs
      const apiUrl =
        `https://gifsnap.com/api/v1/gifs/search` +
        `?q=${encodeURIComponent('nuclear strike')}` +
        `&page=1&limit=25`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(
          `GifSnap API returned HTTP ${response.status}`
        );
      }

      const data = await response.json();

      console.log('GifSnap response:', data);

      const gifs = Array.isArray(data.data)
        ? data.data.filter(
            (gif) =>
              gif &&
              gif.type === 'gif' &&
              gif.url
          )
        : [];

      if (gifs.length === 0) {
        throw new Error('No nuclear strike GIFs found.');
      }

      // Pick a random GIF
      const randomGif =
        gifs[Math.floor(Math.random() * gifs.length)];

      const gifUrl = randomGif.url;

      const embed = successEmbed(
        '☢️ NUCLEAR STRIKE!',
        `☢️ **${attackerName}** has launched a **NUCLEAR STRIKE** on **${targetName}**! 💥`
      );

      embed.setImage(gifUrl);

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });

    } catch (error) {
      console.error('Nuclear Strike GIF error:', error);

      // Strike still happens if the GIF service fails
      const embed = successEmbed(
        '☢️ NUCLEAR STRIKE!',
        `☢️ **${attackerName}** has launched a **NUCLEAR STRIKE** on **${targetName}**! 💥`
      );

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }
  },
};

