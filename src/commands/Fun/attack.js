import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName("attack")
    .setDescription("Attack another user!")
    .addUserOption((option) =>
      option
        .setName("person")
        .setDescription("The person you want to attack.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("How you want to attack them.")
        .setRequired(true)
        .addChoices(
          { name: "👋 Slap", value: "slap" },
          { name: "👊 Punch", value: "punch" },
          { name: "🔨 Bonk", value: "bonk" },
          { name: "🦷 Bite", value: "bite" },
          { name: "🦵 Kick", value: "kick" },
          { name: "🖕 Middle Finger", value: "middle_finger" }
        )
    ),

  category: 'Fun',

  async execute(interaction, config, client) {
    await InteractionHelper.safeDefer(interaction);

    const attacker = interaction.member;
    const target = interaction.options.getMember("person");
    const type = interaction.options.getString("type");

    // Available attack types
    const attacks = {
      slap: {
        emoji: "👋",
        name: "Slap",
        verb: "slaps",
        search: "slap"
      },

      punch: {
        emoji: "👊",
        name: "Punch",
        verb: "punches",
        search: "punch"
      },

      bonk: {
        emoji: "🔨",
        name: "Bonk",
        verb: "bonks",
        search: "bonk"
      },

      bite: {
        emoji: "🦷",
        name: "Bite",
        verb: "bites",
        search: "bite"
      },

      kick: {
        emoji: "🦵",
        name: "Kick",
        verb: "kicks",
        search: "kick"
      },

      middle_finger: {
        emoji: "🖕",
        name: "Middle Finger",
        verb: "gives the middle finger to",
        search: "middle finger"
      }
    };

    const attack = attacks[type];

    // Wrong usage
    if (!target || !attack) {
      const embed = warningEmbed(
        "❌ Wrong Usage",
        `Please provide a valid person and attack type.\n\n` +
        `**Available attack types:**\n` +
        `👋 **Slap**\n` +
        `👊 **Punch**\n` +
        `🔨 **Bonk**\n` +
        `🦷 **Bite**\n` +
        `🦵 **Kick**\n` +
        `🖕 **Middle Finger**`
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    // Prevent attacking yourself
    if (attacker.id === target.id) {
      const embed = warningEmbed(
        "💥 Invalid Target",
        `**${attacker.displayName}**, you can't attack yourself!`
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    // Prevent attacking bots
    if (target.user.bot) {
      const embed = warningEmbed(
        "🤖 Invalid Target",
        "You can't attack a bot! Pick a real person instead."
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    const attackerName =
      attacker.nickname || attacker.user.displayName;

    const targetName =
      target.nickname || target.user.displayName;

    try {
      // Search GifSnap for the selected attack
      const apiUrl =
        `https://gifsnap.com/api/v1/gifs/search` +
        `?q=${encodeURIComponent(attack.search)}` +
        `&page=1&limit=25`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(
          `GifSnap API returned HTTP ${response.status}`
        );
      }

      const data = await response.json();

      console.log("GifSnap response:", data);

      // Get GIF results
      const gifs = Array.isArray(data.data)
        ? data.data.filter(
            (gif) => gif && gif.type === "gif" && gif.url
          )
        : [];

      if (gifs.length === 0) {
        throw new Error(
          `No GIFs found for "${attack.search}".`
        );
      }

      // Pick a random GIF
      const randomGif =
        gifs[Math.floor(Math.random() * gifs.length)];

      const gifUrl = randomGif.url;

      const embed = successEmbed(
        `${attack.emoji} ${attack.name}!`,
        `${attack.emoji} **${attackerName}** ${attack.verb} **${targetName}**!`
      );

      embed.setImage(gifUrl);

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });

    } catch (error) {
      console.error("Attack GIF error:", error);

      // Still show the attack if GIF service fails
      const embed = successEmbed(
        `${attack.emoji} ${attack.name}!`,
        `${attack.emoji} **${attackerName}** ${attack.verb} **${targetName}**!`
      );

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }
  },
};
