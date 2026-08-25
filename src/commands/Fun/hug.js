import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName("hug")
    .setDescription("Give another user a hug!")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user you want to hug.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Add a custom message to your hug.")
        .setRequired(false)
    ),

  category: 'Fun',

  async execute(interaction, config, client) {
    await InteractionHelper.safeDefer(interaction);

    const hugger = interaction.member;
    const target = interaction.options.getMember("user");
    const customMessage = interaction.options.getString("message");

    // Prevent hugging yourself
    if (hugger.id === target.id) {
      const embed = warningEmbed(
        "🤗 Invalid Hug",
        `**${hugger.displayName}**, you can't hug yourself!`
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    // Prevent hugging bots
    if (target.user.bot) {
      const embed = warningEmbed(
        "🤖 Invalid Target",
        "You can't hug a bot! Hug a real person instead."
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    const huggerName = hugger.nickname || hugger.user.displayName;
    const targetName = target.nickname || target.user.displayName;

    // Get a random GIPHY hug GIF
    const apiKey = config.giphyApiKey;

    if (!apiKey) {
      const embed = warningEmbed(
        "⚠️ GIF Error",
        "The GIPHY API key hasn't been configured."
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/random?api_key=${encodeURIComponent(apiKey)}&tag=hug&rating=g`
      );

      if (!response.ok) {
        throw new Error(`GIPHY returned ${response.status}`);
      }

      const data = await response.json();

      const gifUrl = data?.data?.images?.original?.url;

      if (!gifUrl) {
        throw new Error("No GIF was returned.");
      }

      const description = customMessage
        ? `🤗 **${huggerName}** hugs **${targetName}**!\n\n${customMessage}`
        : `🤗 **${huggerName}** gives **${targetName}** a big hug!`;

      const embed = successEmbed(
        "🤗 Hug!",
        description
      );

      embed.setImage(gifUrl);

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });

    } catch (error) {
      console.error("Hug GIF error:", error);

      const embed = successEmbed(
        "🤗 Hug!",
        customMessage
          ? `**${huggerName}** hugs **${targetName}**!\n\n${customMessage}`
          : `**${huggerName}** gives **${targetName}** a big hug!`
      );

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }
  },
};
