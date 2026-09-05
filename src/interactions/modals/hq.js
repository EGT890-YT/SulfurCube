import { assertHQOwner } from '../../config/owner.js';

export default {
  name: 'hq_message',
  async execute(interaction, client, args) {
    if (!assertHQOwner(interaction)) return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
    const guild = client.guilds.cache.get(args[0]);
    if (!guild) return interaction.reply({ content: '❌ That guild is no longer available.', ephemeral: true });

    const message = interaction.fields.getTextInputValue('message');
    const me = guild.members.me ?? await guild.members.fetchMe();
    const channel = guild.systemChannel
      ?? guild.channels.cache.find((c) => c.isTextBased() && c.permissionsFor(me)?.has('SendMessages'));

    if (!channel) return interaction.reply({ content: `❌ I could not find a writable text channel in **${guild.name}**.`, ephemeral: true });

    await channel.send(message);
    return interaction.reply({ content: `💬 Sent your message to **${guild.name}** in ${channel}.`, ephemeral: true });
  },
};
