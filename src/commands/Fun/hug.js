const response = await fetch("https://api.waifu.pics/sfw/hug");

if (!response.ok) {
  throw new Error(`API returned ${response.status}`);
}

const data = await response.json();

if (!data.url) {
  throw new Error("API did not return a GIF URL.");
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
  content: data.url,
  embeds: [embed]
});
