import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName("hit")
    .setDescription("Hit another user!")
    .addUserOption((option) =>
      option
        .setName("person")
        .setDescription("The person you want to hit.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("How you want to hit them.")
        .setRequired(true)
        .addChoices(
          { name: "👋 Slap", value: "slap" },
          { name: "👊 Punch", value: "punch" },
          { name: "🔨 Bonk", value: "bonk" },
          { name: "🦷 Bite", value: "bite" },
          { name: "🦵 Kick", value: "kick" }
        )
    ),

  category: 'Fun',

  async execute(interaction, config, client) {
    await InteractionHelper.safeDefer(interaction);

    const hitter = interaction.member;
    const target = interaction.options.getMember("person");
    const type = interaction.options.getString("type");

    // Prevent hitting yourself
    if (hitter.id === target.id) {
      const embed = warningEmbed(
        "💥 Invalid Target",
        `**${hitter.displayName}**, you can't hit yourself!`
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    // Prevent hitting bots
    if (target.user.bot) {
      const embed = warningEmbed(
        "🤖 Invalid Target",
        "You can't hit a bot! Pick a real person instead."
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    const hitterName =
      hitter.nickname || hitter.user.displayName;

    const targetName =
      target.nickname || target.user.displayName;

    const actions = {
      slap: {
        emoji: "👋",
        name: "Slap",
        text: "slaps"
      },

      punch: {
        emoji: "👊",
        name: "Punch",
        text: "punches"
      },

      bonk: {
        emoji: "🔨",
        name: "Bonk",
        text: "bonks"
      },

      bite: {
        emoji: "🦷",
        name: "Bite",
        text: "bites"
      },

      kick: {
        emoji: "🦵",
        name: "Kick",
        text: "kicks"
      }
    };

    const action = actions[type];

    try {
      // Nekos.Best random GIF endpoint
      const response = await fetch(
        `https://nekos.best/api/v2/${type}?amount=1`,
        {
          headers: {
            "User-Agent": "SoverignSMP-Bot/1.0"
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          `Nekos.Best API returned ${response.status}`
        );
      }

      const data = await response.json();

      const gifUrl = data?.results?.[0]?.url;

      if (!gifUrl) {
        console.error("Nekos.Best response:", data);
        throw new Error("No GIF URL was returned.");
      }

      const embed = successEmbed(
        `${action.emoji} ${action.name}!`,
        `${action.emoji} **${hitterName}** ${action.text} **${targetName}**!`
      );

      embed.setImage(gifUrl);

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });

    } catch (error) {
      console.error("Hit GIF error:", error);

      // Still send the message if the GIF API fails
      const embed = successEmbed(
        `${action.emoji} ${action.name}!`,
        `${action.emoji} **${hitterName}** ${action.text} **${targetName}**!`
      );

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }
  },
};
