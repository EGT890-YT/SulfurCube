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
        .setDescription('Choose one person to send on a date.')
        .setRequired(false)
    ),

  category: 'Fun',

  async execute(interaction, config, client) {
    await InteractionHelper.safeDefer(interaction);

    const selectedPerson = interaction.options.getMember('person');

    let person1;
    let person2;

    try {
      // Get all members in the server
      const members = await interaction.guild.members.fetch();

      // Only allow real human members
      const eligibleMembers = members.filter(
        (member) => !member.user.bot
      );

      /*
       * /ship @person
       *
       * The selected person goes on the date
       * with somebody completely random.
       */
      if (selectedPerson) {
        // Bots cannot be selected
        if (selectedPerson.user.bot) {
          const embed = warningEmbed(
            '🤖 Invalid Person',
            'Bots aren\'t allowed on dates! 😭'
          );

          return await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed]
          });
        }

        person1 = selectedPerson;

        // Remove selected person from the random pool
        const randomPool = eligibleMembers.filter(
          (member) => member.id !== person1.id
        );

        if (randomPool.size === 0) {
          const embed = warningEmbed(
            '💕 Not Enough People',
            'There aren\'t enough people in the server to create a date!'
          );

          return await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed]
          });
        }

        const randomIndex = Math.floor(
          Math.random() * randomPool.size
        );

        person2 = [...randomPool.values()][randomIndex];

      } else {
        /*
         * /ship
         *
         * Pick TWO completely random humans.
         */
        if (eligibleMembers.size < 2) {
          const embed = warningEmbed(
            '💕 Not Enough People',
            'There aren\'t enough people in the server to create a date!'
          );

          return await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed]
          });
        }

        const randomMembers = [...eligibleMembers.values()];

        const firstIndex = Math.floor(
          Math.random() * randomMembers.length
        );

        person1 = randomMembers[firstIndex];

        // Remove first person so they cannot be selected again
        const remainingMembers = randomMembers.filter(
          (member) => member.id !== person1.id
        );

        const secondIndex = Math.floor(
          Math.random() * remainingMembers.length
        );

        person2 = remainingMembers[secondIndex];
      }

    } catch (error) {
      console.error('Ship member selection error:', error);

      const embed = warningEmbed(
        '❌ Error',
        'I couldn\'t find enough people to create a date right now!'
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    // Extra safety check
    if (!person1 || !person2 || person1.id === person2.id) {
      const embed = warningEmbed(
        '💕 Invalid Ship',
        'I couldn\'t create a valid pairing. Try again!'
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    // Get names using server nicknames, falling back to display names
    const person1Name =
      person1.nickname ||
      person1.user.displayName;

    const person2Name =
      person2.nickname ||
      person2.user.displayName;

    // Actual Discord pings
    const person1Mention = `<@${person1.id}>`;
    const person2Mention = `<@${person2.id}>`;

    /*
     * DATE TYPES
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

    // Randomize date before the loading stages
    const date =
      dates[Math.floor(Math.random() * dates.length)];

    /*
     * FIRST LOADING STAGE
     */
    const loadingEmbed = successEmbed(
      '💕 Loading...',
      '🔮 Finding out who is going on a date...'
    );

    await InteractionHelper.safeEditReply(interaction, {
      embeds: [loadingEmbed]
    });

    // Wait 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));

    /*
     * REVEAL THE TWO PEOPLE
     */
    const peopleEmbed = successEmbed(
      '💕 Date Pair!',
      `💞 ${person1Mention} and ${person2Mention} are going on a date together!`
    );

    await InteractionHelper.safeEditReply(interaction, {
      embeds: [peopleEmbed],
      allowedMentions: {
        users: [person1.id, person2.id]
      }
    });

    /*
     * SECOND LOADING STAGE
     */
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const dateLoadingEmbed = successEmbed(
      `${date.emoji} Loading Date...`,
      `📅 Deciding what **${person1Name}** and **${person2Name}** are going to do...`
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

    // Add date-related GIF if one was found
    if (gifUrl) {
      finalEmbed.setImage(gifUrl);
    }

    await InteractionHelper.safeEditReply(interaction, {
      embeds: [finalEmbed]
    });
  },
};

