const formatChannelList = (arr: string[]) => {
	if (arr.length === 0) {
		return '';
	} else if (arr.length === 1) {
		return `${arr[0]}.`;
	} else if (arr.length === 2) {
		return `${arr[0]} or ${arr[1]}.`;
	} else {
		return `${arr.slice(0, -1).join(', ')}, or ${arr[arr.length - 1]}.`;
	}
};

export const bot_capability = `The bot is capable of single-turn conversations, meaning it can only provide an appropriate text reply to a user's message at a time. If the user sends another follow-up message, the bot is unable to respond further. Additionally, the bot cannot perform other actions such as removing users from the server, banning users from posting, reacting with emojis, or sending direct messages to other users or moderators.`;
export const channels = ['#general', '#introduction', '#faq', '#random'];
export const input_specification = `The input should consist of a Discord channel name and a user message. The channel name must begin with a hash (#) followed by a valid channel identifier, chosen from the following available channels on the server: ${formatChannelList(channels)} The user message should be a single string that realistically represents something a user might post in that channel. It must not include explicit formatting instructions, metadata, or explanations of its purpose. The message should be plausible and use natural language typical of a real Discord community, and the input must not contain bot commands, markup syntax, or JSON structures.`;
export const community_tone = `The Discord community described here typically engages in conversations that are a mix of earnest insights, sarcastic humor, and supportive exchanges. Language style notably includes academic or technical discussions, slang, frequent use of emojis, and humor relying on cultural references and inside jokes. Common interactive patterns often involve debating tech topics, light teasing, and collectively reminiscing about shared experiences. Implicit moderation norms discourage excessive formality and overly aggressive behavior, favoring peer-driven moderation and mutual support. Conflicts generally resolve through humor or empathetic dialogue, showcasing an underlying respect for community members' perspectives.`;
