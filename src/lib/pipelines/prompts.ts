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
export const channels = ['#introduction', '#general', '#random', '#faq', '#celebrate', '#job'];
export const input_specification = `The input should consist of a Discord channel name and a user message. The channel name must begin with a hash (#) followed by a valid channel identifier, chosen from the following available channels on the server: ${formatChannelList(channels)} The user message should be a single string that realistically represents something a user might post in that channel. It must not include explicit formatting instructions, metadata, or explanations of its purpose. The message should be plausible and use natural language typical of a real Discord community, and the input must not contain bot commands, markup syntax, or JSON structures.`;
export const community_tone = `A Discord server where people come together with something in common. The community includes both newcomers and long-time members. The tone is generally friendly and collaborative, though discussions can sometimes become heated. Members aim to foster a welcoming and engaged environment. This is not a gaming community, but a shared space among friends with a common interest or connection.`;
