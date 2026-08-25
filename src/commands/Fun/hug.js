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

    // Can't hug yourself
    if (hugger.id === target.id) {
      const embed = warningEmbed(
        "🤗 Invalid Hug",
        `**${hugger.displayName}**, you can't hug yourself!`
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    // Can't hug bots
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

    try {
      // Get a random hug GIF
      const response = await fetch(
        "https://api.waifu.pics/sfw/hug"
      );

      if (!response.ok) {
        throw new Error(`GIF API returned ${response.status}`);
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error("No GIF URL was returned.");
      }

      const description = customMessage
        ? `🤗 **${huggerName}** hugs **${targetName}**!\n\n${customMessage}`
        : `🤗 **${huggerName}** gives **${targetName}** a big hug!`;

      const embed = successEmbed(
        "🤗 Hug!",
        description
      );

      embed.setImage(data.url);

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });

    } catch (error) {
      console.error("Hug GIF error:", error);

      // Still send the hug if the GIF API fails
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
