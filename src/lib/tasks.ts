import _ from 'lodash';

export function checkEmptyTask(tasks: Tasks) {
	const hasEmptyString = Object.values(tasks).some((obj) =>
		Object.values(obj).some((value) => value.trim() === '')
	);
	return hasEmptyString;
}

export function isTaskEmpty(task: Task) {
	if (task.name.trim() === '' && task.trigger.trim() === '' && task.action.trim() === '')
		return true;
	else return false;
}

export function trimTaskCustomizer(objValue: string, othValue: string) {
	// If both values are strings, compare their trimmed versions
	if (_.isString(objValue) && _.isString(othValue)) {
		return _.trim(objValue) === _.trim(othValue);
	}
	// Let lodash handle all other types (including objects)
	// by returning undefined
}

export function trimWhiteSpaceInTasks(tasks: Tasks) {
	const trimmedTasks = Object.fromEntries(
		Object.entries(tasks).map(([taskKey, taskObj]) => [
			taskKey,
			Object.fromEntries(
				Object.entries(taskObj).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
			)
		])
	);
	return trimmedTasks;
}
