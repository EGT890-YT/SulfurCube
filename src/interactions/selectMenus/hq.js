import { assertHQOwner } from '../../config/owner.js';
import { createHqPanel } from '../../commands/Owner/hq.js';

export default {
  name: 'hq_guild',
  async execute(interaction, client) {
    if (!assertHQOwner(interaction)) return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
    return interaction.update(createHqPanel(client, interaction.values[0]));
  },
};
