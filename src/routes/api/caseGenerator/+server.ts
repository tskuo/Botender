import { underspecifiedPipeline } from '$lib/server/openAI/underspecifiedPipeline';
import { overspecifiedPipeline } from '$lib/server/openAI/overspecifiedPipeline';
import { consequencePipeline } from '$lib/server/openAI/consequencePipeline';
import { generalEvaluator } from '$lib/server/openAI/generalEvaluator';
import { json, error } from '@sveltejs/kit';
import _ from 'lodash';
import { isTaskEmpty, trimTaskCustomizer } from '$lib/tasks';

export const POST = async ({ request }) => {
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

		const underspecifiedPromise = Promise.allSettled(
			diffTasks.map((diffTask: Task) => underspecifiedPipeline(diffTask, newTasks))
		);

		const overspecifiedPromise = Promise.allSettled(
			diffTasks.map((diffTask: Task) => overspecifiedPipeline(diffTask, newTasks))
		);

		const consequencePromise = Promise.allSettled(
			diffTasks.map((diffTask: Task) => consequencePipeline(diffTask, newTasks))
		);

		const [underspecifiedSettled, overspecifiedSettled, consequenceSettled] = await Promise.all([
			underspecifiedPromise,
			overspecifiedPromise,
			consequencePromise
		]);

		// Filter out rejected promises and extract the values from fulfilled ones.
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

		// Combine arrays
		const allRawCases = [...underspecifiedCases, ...overspecifiedCases, ...consequenceCases];
		const evaluatedCases = await generalEvaluator(newTasks, allRawCases);
		const allCases = evaluatedCases.map((c) => ({ ...c, tmpId: crypto.randomUUID() }));

		return json({ cases: _.orderBy(allCases, ['rating'], ['desc']) }, { status: 201 });
	} catch {
		throw error(400, 'Fail to generate cases');
	}
};
