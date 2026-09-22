import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getConfiguredYouTubeHandles, removeYouTubeNotifications, MAX_SUBSCRIPTIONS } from '../../services/youtubeNotifyService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('removeupload')
    .setDescription('Remove YouTube upload notifications for a channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option =>
      option
        .setName('youtube_handle')
        .setDescription('Select a configured YouTube channel.')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  category: 'Utility',

  async autocomplete(interaction, client) {
    const focused = interaction.options.getFocused().toLowerCase();
    const entries = await getConfiguredYouTubeHandles(client, interaction.guild.id);
    return interaction.respond(
      entries
        .filter(entry => `${entry.handle} ${entry.name}`.toLowerCase().includes(focused))
        .slice(0, 25)
        .map(entry => ({
          name: `${entry.name} (${entry.handle})`.slice(0, 100),
          value: entry.handle,
        }))
    );
  },

  async execute(interaction, config, client) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: '❌ You need **Manage Server** to manage YouTube notifications.', ephemeral: true });
    }
    const handle = interaction.options.getString('youtube_handle', true);
    try {
      const result = await removeYouTubeNotifications(client, interaction.guild.id, handle);
      return interaction.reply({
        content: `✅ Removed **${result.removed}** notification configuration${result.removed === 1 ? '' : 's'} for **${handle}**. **${result.remaining}/${MAX_SUBSCRIPTIONS}** slots remain configured.`,
        ephemeral: true,
      });
    } catch (error) {
      return interaction.reply({ content: `❌ ${error.message || 'Failed to remove YouTube notifications.'}`, ephemeral: true });
    }
  },
};