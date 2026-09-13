import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

const IMMORTAL_USER_ID = '1281977840648327292';
const NIBBLE_ALLOWED_USER_ID = '1524531035394805860';

export default {
  data: new SlashCommandBuilder()
    .setName("attack")
    .setDescription("Attack another user!")
    .addUserOption((option) => option.setName("person").setDescription("The person you want to attack.").setRequired(true))
    .addStringOption((option) => option.setName("type").setDescription("How you want to attack them.").setRequired(true).addChoices(
      { name: "👋 Slap", value: "slap" },
      { name: "👊 Punch", value: "punch" },
      { name: "🔨 Bonk", value: "bonk" },
      { name: "🦷 Bite", value: "bite" },
      { name: "🦵 Kick", value: "kick" },
      { name: "🖕 Finger", value: "finger" },
      { name: "🫦 Nibble", value: "nibble" }
    )),

  category: 'Fun',

  async execute(interaction, config, client) {
    await InteractionHelper.safeDefer(interaction);

    const attacker = interaction.member;
    const targetUser = interaction.options.getUser("person");
    const type = interaction.options.getString("type");

    // Resolve the target from the guild member cache when possible, then
    // fetch it when Discord has not cached the member yet.
    let target = interaction.options.getMember("person");
    if (!target && targetUser && interaction.guild) {
      target = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    }

    const attacks = {
      slap: { emoji: "👋", name: "Slap", verb: "slaps", search: "slap" },
      punch: { emoji: "👊", name: "Punch", verb: "punches", search: "punch" },
      bonk: { emoji: "🔨", name: "Bonk", verb: "bonks", search: "bonk" },
      bite: { emoji: "🦷", name: "Bite", verb: "bites", search: "bite" },
      kick: { emoji: "🦵", name: "Kick", verb: "kicks", search: "kick" },
      finger: { emoji: "🖕", name: "Finger", verb: "gives the finger to", search: "middle finger" },
      nibble: { emoji: "🫦", name: "Nibble", verb: "nibbles", search: "nibble" }
    };

    const attack = attacks[type];

    if (!targetUser || !attack) {
      const embed = warningEmbed("❌ Wrong Usage", `Please provide a valid person and attack type.\n\n**Available attack types:**\n👋 **Slap**\n👊 **Punch**\n🔨 **Bonk**\n🦷 **Bite**\n🦵 **Kick**\n🖕 **Finger**\n🫦 **Nibble**`);
      return InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }

    if (!target) {
      const embed = warningEmbed("❌ Invalid Target", "I couldn't find that person in this server.");
      return InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }

    // The immortal user is protected from every attack except Nibble.
    if (targetUser.id === IMMORTAL_USER_ID) {
      if (type !== 'nibble') {
        const embed = warningEmbed("🛡️ Attack Blocked", `**${targetUser.displayName}** is protected from attacks. Nice try 😭`);
        return InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      }

      // Only this specific user may Nibble the immortal user.
      if (interaction.user.id !== NIBBLE_ALLOWED_USER_ID) {
        const embed = warningEmbed("🛡️ Nibble Blocked", `Only <@${NIBBLE_ALLOWED_USER_ID}> can nibble **${targetUser.displayName}**.`);
        return InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      }
    }

    if (attacker.id === targetUser.id) {
      const embed = warningEmbed("💥 Invalid Target", `**${attacker.displayName}**, you can't attack yourself!`);
      return InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }

    if (targetUser.bot) {
      const embed = warningEmbed("🤖 Invalid Target", "You can't attack a bot! Pick a real person instead.");
      return InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }

    const attackerName = attacker.nickname || interaction.user.displayName;
    const targetName = target.nickname || targetUser.displayName;

    try {
      const apiUrl = `https://gifsnap.com/api/v1/gifs/search?q=${encodeURIComponent(attack.search)}&page=1&limit=25`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`GifSnap API returned HTTP ${response.status}`);
      const data = await response.json();
      const gifs = Array.isArray(data.data) ? data.data.filter((gif) => gif && gif.type === "gif" && gif.url) : [];
      if (gifs.length === 0) throw new Error(`No GIFs found for "${attack.search}".`);

      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
      const embed = successEmbed(`${attack.emoji} ${attack.name}!`, `${attack.emoji} **${attackerName}** ${attack.verb} **${targetName}**!`);
      embed.setImage(randomGif.url);
      await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    } catch (error) {
      console.error("Attack GIF error:", error);
      const embed = successEmbed(`${attack.emoji} ${attack.name}!`, `${attack.emoji} **${attackerName}** ${attack.verb} **${targetName}**!`);
      await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }
  },
};
