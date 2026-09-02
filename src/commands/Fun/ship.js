import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ship')
    .setDescription('Send two people on a date! 💕')
    .addUserOption((option) =>
      option
        .setName('person')
        .setDescription('The person you want to send on a date with you.')
        .setRequired(false)
    ),

  category: 'Fun',

  async execute(interaction, config, client) {
    await InteractionHelper.safeDefer(interaction);

    const selectedPerson = interaction.options.getMember('person');
    const shipper = interaction.member;

    let person1 = shipper;
    let person2 = selectedPerson;

    // If no person was specified, choose a random human member
    if (!person2) {
      try {
        const members = await interaction.guild.members.fetch();

        const eligibleMembers = members.filter(
          (member) =>
            !member.user.bot &&
            member.id !== shipper.id
        );

        if (eligibleMembers.size === 0) {
          const embed = warningEmbed(
            '💕 No One To Ship',
            'There are no other human members available to go on a date with you!'
          );

          return await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed]
          });
        }

        const randomIndex = Math.floor(
          Math.random() * eligibleMembers.size
        );

        person2 = [...eligibleMembers.values()][randomIndex];

      } catch (error) {
        console.error('Ship member selection error:', error);

        const embed = warningEmbed(
          '❌ Error',
          'I couldn\'t find someone to ship with you right now!'
        );

        return await InteractionHelper.safeEditReply(interaction, {
          embeds: [embed]
        });
      }
    }

    // Prevent shipping yourself with yourself
    if (person1.id === person2.id) {
      const embed = warningEmbed(
        '💕 Invalid Ship',
        'You can\'t go on a date with yourself! 😭'
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    // Prevent bots from being manually selected
    if (person2.user.bot) {
      const embed = warningEmbed(
        '🤖 Invalid Ship',
        'Bots aren\'t allowed on dates! Pick a real person instead. 😭'
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    // Get names using server nickname, falling back to display name
    const person1Name =
      person1.nickname ||
      person1.user.displayName;

    const person2Name =
      person2.nickname ||
      person2.user.displayName;

    /*
     * DATE TYPES
     *
     * Each date has its own GIF search term.
     * The GIF is about the date itself, NOT the people.
     */
    const dates = [
      {
        name: 'Beach Date',
        emoji: '🏖️',
        search: 'beach date'
      },
      {
        name: 'Dinner Date',
        emoji: '🍽️',
        search: 'romantic dinner'
      },
      {
        name: 'Movie Date',
        emoji: '🎬',
        search: 'movie date'
      },
      {
        name: 'Pizza Date',
        emoji: '🍕',
        search: 'pizza date'
      },
      {
        name: 'Coffee Date',
        emoji: '☕',
        search: 'coffee date'
      },
      {
        name: 'Park Date',
        emoji: '🌳',
        search: 'park date'
      },
      {
        name: 'Ice Cream Date',
        emoji: '🍦',
        search: 'ice cream date'
      },
      {
        name: 'Arcade Date',
        emoji: '🕹️',
        search: 'arcade date'
      },
      {
        name: 'Bowling Date',
        emoji: '🎳',
        search: 'bowling date'
      },
      {
        name: 'Picnic Date',
        emoji: '🧺',
        search: 'picnic date'
      }
    ];

    // Select the date BEFORE the loading stages
    const date =
      dates[Math.floor(Math.random() * dates.length)];

    /*
     * FIRST LOADING STAGE
     */
    const loadingEmbed = successEmbed(
      '💕 Loading...',
      '🔮 Finding your perfect date...'
    );

    await InteractionHelper.safeEditReply(interaction, {
      embeds: [loadingEmbed]
    });

    // Wait 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));

    /*
     * SHOW THE TWO PEOPLE
     */
    const peopleEmbed = successEmbed(
      '💕 SHIP!',
      `💞 **${person1Name}** + **${person2Name}**`
    );

    await InteractionHelper.safeEditReply(interaction, {
      embeds: [peopleEmbed]
    });

    // Short pause before second loading stage
    await new Promise((resolve) => setTimeout(resolve, 1000));

    /*
     * SECOND LOADING STAGE
     */
    const dateLoadingEmbed = successEmbed(
      `${date.emoji} Loading Date...`,
      `📅 Planning a **${date.name}** for **${person1Name}** and **${person2Name}**...`
    );

    await InteractionHelper.safeEditReply(interaction, {
      embeds: [dateLoadingEmbed]
    });

    // Wait another 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));

    /*
     * GET A RANDOM GIF FOR THE DATE
     */
    let gifUrl = null;

    try {
      const apiUrl =
        `https://gifsnap.com/api/v1/gifs/search` +
        `?q=${encodeURIComponent(date.search)}` +
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

      if (gifs.length > 0) {
        const randomGif =
          gifs[Math.floor(Math.random() * gifs.length)];

        gifUrl = randomGif.url;
      }

    } catch (error) {
      console.error('Ship GIF error:', error);
    }

    /*
     * FINAL RESULT
     */
    const finalEmbed = successEmbed(
      `${date.emoji} Date Time!`,
      `💕 **${person1Name}** and **${person2Name}** are going on a **${date.name}!**`
    );

    // Only add the GIF if one was successfully found
    if (gifUrl) {
      finalEmbed.setImage(gifUrl);
    }

    await InteractionHelper.safeEditReply(interaction, {
      embeds: [finalEmbed]
    });
  },
};

