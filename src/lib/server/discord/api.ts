import { DISCORD_TOKEN, VERCEL_WEB_APP_URL } from '$env/static/private';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

/**
 * Finds a text channel by name within a specific guild.
 * @param guildId The ID of the server to search in.
 * @param channelName The name of the channel to find (e.g., 'botender').
 * @returns The channel object if found, otherwise null.
 */
async function findChannelByName(guildId: string, channelName: string) {
	const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/channels`, {
		headers: {
			Authorization: `Bot ${DISCORD_TOKEN}`
		}
	});

	if (!response.ok) {
		console.error('Failed to fetch channels for guild:', await response.text());
		return null;
	}

	const channels = await response.json();
	// Channel types: 0 = GUILD_TEXT
	return channels.find((ch: any) => ch.type === 0 && ch.name === channelName);
}

/**
 * Creates a new thread in a specified channel to announce a proposal.
 * @param guildId The ID of the server.
 * @param proposalId The ID of the newly created proposal.
 * @param proposalTitle The title of the proposal.
 * @param proposalDescription The description of the proposal.
 * @returns The ID of the new thread if successful, otherwise null.
 */
export async function createProposalThread(
	guildId: string,
	proposalId: string,
	proposalTitle: string,
	proposalDescription: string,
	initiatorId: string
) {
	const channel = await findChannelByName(guildId, 'botender');

	if (!channel) {
		console.error(`Could not find a text channel named #botender in guild ${guildId}`);
		return null;
	}

	const proposalUrl = `${VERCEL_WEB_APP_URL}/guilds/${guildId}/proposals/${proposalId}`;

	// --- Step 1: Send the initial message to the channel ---
	const messageResponse = await fetch(`${DISCORD_API_BASE}/channels/${channel.id}/messages`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bot ${DISCORD_TOKEN}`
		},
		body: JSON.stringify({
			content: `💡 A new proposal has been initiated by <@${initiatorId}>!`,
			embeds: [
				{
					title: proposalTitle,
					description: `${proposalDescription}`,
					color: parseInt('#5865f2'.replace('#', ''), 16)
					// footer: {
					// 	text: `Proposal ID: ${proposalId}`
					// }
				}
			],
			components: [
				{
					type: 1, // Action Row
					components: [
						{
							type: 2, // Button
							style: 5, // Link style
							label: 'View Proposal',
							url: proposalUrl
						}
					]
				}
			]
		})
	});

	if (!messageResponse.ok) {
		console.error('Failed to send initial proposal message:', await messageResponse.text());
		return null;
	}

	const messageData = await messageResponse.json();

	// --- Step 2: Create a thread on the message we just sent ---
	const threadResponse = await fetch(
		`${DISCORD_API_BASE}/channels/${channel.id}/messages/${messageData.id}/threads`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bot ${DISCORD_TOKEN}`
			},
			body: JSON.stringify({
				name: `Proposal: ${proposalTitle.substring(0, 80)}`, // Thread titles have a 100-char limit
				auto_archive_duration: 1440 // 24 hours
			})
		}
	);

	if (!threadResponse.ok) {
		console.error('Failed to create Discord thread on the message:', await threadResponse.text());
		// Even if this fails, the main message was still sent. We'll return null.
		return null;
	}

	const threadData = await threadResponse.json();

	// --- Step 3: Send a welcome message inside the thread ---
	const welcomeResponse = await fetch(`${DISCORD_API_BASE}/channels/${threadData.id}/messages`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bot ${DISCORD_TOKEN}`
		},
		body: JSON.stringify({
			content: `👋 **Welcome to the discussion thread for this proposal!**

🗣️ **Use this thread to:**
- Discuss the proposal
- Collaborate on edits
- Share feedback and suggestions

🔔 **Follow this thread to receive updates when:**
- New edits are saved
- The proposal is deployed
- The proposal is closed

📝 You can view the full proposal details and submit edits on the proposal page using the "View Proposal" button above.

Let's get the discussion started! 🚀`
		})
	});

	if (!welcomeResponse.ok) {
		console.error('Failed to send welcome message to thread:', await welcomeResponse.text());
		// Don't return null here since the thread was still created successfully
	}

	console.log(
		`Successfully created thread ${threadData.id} for proposal ${proposalId} in guild ${guildId}`
	);

	return { messageId: messageData.id, threadId: threadData.id }; // Return the new message's and thread's ID
}

/**
 * Sends a notification message to a specific Discord thread when a proposal is edited.
 * @param threadId The ID of the thread to post the message in.
 * @param editorName The name of the user who made the edit.
 * @param guildId The ID of the guild.
 * @param proposalId The ID of the proposal.
 */
export async function sendEditNotificationToThread(
	guildId: string,
	threadId: string,
	editorId: string,
	proposalId: string
) {
	const proposalUrl = `${VERCEL_WEB_APP_URL}/guilds/${guildId}/proposals/${proposalId}`;

	try {
		const response = await fetch(`${DISCORD_API_BASE}/channels/${threadId}/messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bot ${DISCORD_TOKEN}`
			},
			body: JSON.stringify({
				content: `✏️ A new edit has been saved by <@${editorId}>!`,
				embeds: [
					{
						title: 'View the Latest Edit',
						description: `You can review and upvote the edit for deployment by visiting the proposal page.`,
						color: parseInt('#e0e3ff'.replace('#', ''), 16),
						url: proposalUrl
					}
				]
			})
		});

		if (!response.ok) {
			console.error('Failed to send edit notification to Discord thread:', await response.text());
		}
	} catch (error) {
		console.error('Error sending edit notification:', error);
	}
}
