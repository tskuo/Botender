import { underspecifiedPipeline } from '$lib/server/openAI/underspecifiedPipeline';
import { overspecifiedPipeline } from '$lib/server/openAI/overspecifiedPipeline';
import { consequencePipeline } from '$lib/server/openAI/consequencePipeline';
import { generalEvaluator } from '$lib/server/openAI/generalEvaluator';
import { baselinePipeline } from '$lib/server/openAI/baselinePipeline';
import { json, error } from '@sveltejs/kit';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '$lib/firebase';
import _ from 'lodash';
import { isTaskEmpty, trimTaskCustomizer } from '$lib/tasks';

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

export const POST = async ({ request, params }) => {
	try {
		const { oldTasks, newTasks } = await request.json();

		const diffTasks: Task[] = [];

		for (const [taskId, task] of Object.entries(newTasks)) {
			if (!isTaskEmpty(newTasks[taskId])) {
				if (taskId in oldTasks) {
					if (
						_.isEqualWith(
							_.pick(oldTasks[taskId], ['trigger', 'action']),
							_.pick(newTasks[taskId], ['trigger', 'action']),
							trimTaskCustomizer
						)
					) {
						continue;
					} else {
						diffTasks.push(task as Task);
					}
				} else {
					diffTasks.push(task as Task);
				}
			}
		}

		// Get Guild Specific Info
		if (!params.guildId) {
			throw error(400, 'Error: Guild ID is required');
		}
		const guildDocRef = doc(db, 'guilds', params.guildId);
		const guildDocSnap = await getDoc(guildDocRef);
		if (!guildDocSnap.exists()) {
			throw error(400, `Error: Fail to fetch guild settings (guildId: ${params.guildId})`);
		}
		const community_tone = guildDocSnap.data().community_tone;
		const channels = guildDocSnap
			.data()
			.channels.map((channel: string) => (channel.startsWith('#') ? channel : `#${channel}`))
			.sort();
		const input_specification = `The input should consist of a Discord channel name and a user message. The channel name must begin with a hash (#) followed by a valid channel identifier, chosen from the following available channels on the server: ${formatChannelList(channels)} The user message should be a single string that realistically represents something a user might post in that channel. It must not include explicit formatting instructions, metadata, or explanations of its purpose. The message should be plausible and use natural language typical of a real Discord community, and the input must not contain bot commands, markup syntax, or JSON structures.`;

		// Botender's Pipeline Starts Here
		const underspecifiedPromise = Promise.allSettled(
			diffTasks.map((diffTask: Task) =>
				underspecifiedPipeline(diffTask, newTasks, community_tone, input_specification)
			)
		);

		const overspecifiedPromise = Promise.allSettled(
			diffTasks.map((diffTask: Task) =>
				overspecifiedPipeline(diffTask, newTasks, community_tone, input_specification)
			)
		);

		const consequencePromise = Promise.allSettled(
			diffTasks.map((diffTask: Task) =>
				consequencePipeline(diffTask, newTasks, community_tone, input_specification)
			)
		);

		const [underspecifiedSettled, overspecifiedSettled, consequenceSettled] = await Promise.all([
			underspecifiedPromise,
			overspecifiedPromise,
			consequencePromise
		]);

		const underspecifiedResults = underspecifiedSettled
			.filter((result) => {
				if (result.status === 'rejected')
					console.error('Underspecified pipeline failed:', result.reason);
				return result.status === 'fulfilled';
			})
			.map((result) => (result as PromiseFulfilledResult<any>).value);

		const overspecifiedResults = overspecifiedSettled
			.filter((result) => {
				if (result.status === 'rejected')
					console.error('Overspecified pipeline failed:', result.reason);
				return result.status === 'fulfilled';
			})
			.map((result) => (result as PromiseFulfilledResult<any>).value);

		const consequenceResults = consequenceSettled
			.filter((result) => {
				if (result.status === 'rejected')
					console.error('Consequence pipeline failed:', result.reason);
				return result.status === 'fulfilled';
			})
			.map((result) => (result as PromiseFulfilledResult<any>).value);

		const underspecifiedCases = underspecifiedResults.flat();
		const overspecifiedCases = overspecifiedResults.flat();
		const consequenceCases = consequenceResults.flat();

		const allRawCases = [...underspecifiedCases, ...overspecifiedCases, ...consequenceCases];
		const evaluatedCases = await generalEvaluator(newTasks, allRawCases);
		const allCases = evaluatedCases.map((c) => ({ ...c, tmpId: crypto.randomUUID() }));

		return json({ cases: _.orderBy(allCases, ['rating'], ['desc']) }, { status: 201 });
		// Botender's Pipeline Ends Here

		// Baseline Pipeline Starts Here
		// const baselinePromise = Promise.allSettled(
		// 	diffTasks.map((diffTask: Task) => baselinePipeline(diffTask, newTasks, community_tone, input_specification))
		// );
		// const baselineSettled = await baselinePromise;

		// const baselineResults = baselineSettled
		// 	.filter((result) => {
		// 		if (result.status === 'rejected') console.error('Baseline pipeline failed:', result.reason);
		// 		return result.status === 'fulfilled';
		// 	})
		// 	.map((result) => (result as PromiseFulfilledResult<any>).value);

		// const allCases = baselineResults.flat().map((c) => ({ ...c, tmpId: crypto.randomUUID() }));

		// return json({ cases: allCases }, { status: 201 });
		// Baseline Pipeline Ends Here
	} catch {
		throw error(400, 'Fail to generate cases');
	}
};
