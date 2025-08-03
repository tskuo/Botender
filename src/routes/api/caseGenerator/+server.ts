import { underspecifiedPipeline } from '$lib/server/openAI/underspecifiedPipeline';
import { overspecifiedPipeline } from '$lib/server/openAI/overspecifiedPipeline';
import { consequencePipeline } from '$lib/server/openAI/consequencePipeline';
import { generalEvaluator } from '$lib/server/openAI/generalEvaluator';
import { baselinePipeline } from '$lib/server/openAI/baselinePipeline';
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

		// Botender's Pipeline Starts Here
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
		// 	diffTasks.map((diffTask: Task) => baselinePipeline(diffTask, newTasks))
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
