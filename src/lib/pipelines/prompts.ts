export const bot_capability = `The bot is capable of single-turn conversations, meaning it can only provide an appropriate text reply to a user's message at a time. If the user sends another follow-up message, the bot is unable to respond further. Additionally, the bot cannot perform other actions such as removing users from the server, banning users from posting, reacting with emojis, or sending direct messages to other users or moderators.`;

export const channels = ['#general', '#introduction', '#faq', '#random'];

export const input_specification = [
	`The input consists of a Discord channel name and a user message.`,
	`The channel name must start with a hash (#) followed by a valid channel identifier. Available channels on the server include:`,
	channels.join(' '),
	`The user message must be a single string representing a realistic message that a user might send in that channel.`,
	`The user message must not contain explicit formatting instructions, metadata, or explanations of its purpose.`,
	`The user message must be plausible within a real Discord community and reflect natural language use.`,
	`The input must not include bot commands, markup syntax, or JSON structures.`
].join('\n');

export const community_tone = `The Discord community described here typically engages in conversations that are a mix of earnest insights, sarcastic humor, and supportive exchanges. Language style notably includes academic or technical discussions, slang, frequent use of emojis, and humor relying on cultural references and inside jokes. Common interactive patterns often involve debating tech topics, light teasing, and collectively reminiscing about shared experiences. Implicit moderation norms discourage excessive formality and overly aggressive behavior, favoring peer-driven moderation and mutual support. Conflicts generally resolve through humor or empathetic dialogue, showcasing an underlying respect for community members' perspectives.`;
