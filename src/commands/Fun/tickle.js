import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName("tickle")
    .setDescription("Tickle another user!")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user you want to tickle.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Customize the tickle message.")
        .setRequired(false)
    ),

  category: 'Fun',

  async execute(interaction, config, client) {
    await InteractionHelper.safeDefer(interaction);

    const tickler = interaction.user;
    const target = interaction.options.getUser("user");
    const customMessage = interaction.options.getString("message");

    // Prevent tickling yourself
    if (tickler.id === target.id) {
      const embed = warningEmbed(
        "🤭 Nice Try!",
        `**${tickler.username}**, you can't tickle yourself!`
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    // Prevent tickling bots
    if (target.bot) {
      const embed = warningEmbed(
        "🤖 Invalid Target",
        "You can't tickle a bot! Find a real person to tickle."
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    const defaultMessage =
      `😂 **${tickler.displayName}** is tickling **${target.displayName}**!`;

    const description = customMessage
      ? `😂 **${tickler.displayName}** tickles **${target.displayName}**!\n\n${customMessage}`
      : defaultMessage;

    const embed = successEmbed(
      "🪶 Tickle Attack!",
      description
    );

    await InteractionHelper.safeEditReply(interaction, {
      embeds: [embed]
    });
  },
};
