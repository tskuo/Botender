import { json, error } from '@sveltejs/kit';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '$lib/firebase';

export const PATCH = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(401, 'User authentication error.');
	}
	try {
		const { action = '', generatedId } = await request.json();

		if (action === 'removeCaseCache') {
			if (!generatedId) {
				throw error(400, 'Missing generatedId for removal.');
			}

			// 1. Get a reference to the specific edit document.
			const editDocRef = doc(
				db,
				'guilds',
				params.guildId,
				'proposals',
				params.proposalId,
				'edits',
				params.editId
			);

			// 2. Read the document to get the current state of the array.
			const editDocSnap = await getDoc(editDocRef);

			if (!editDocSnap.exists()) {
				throw error(404, 'Edit document not found.');
			}

			const existingData = editDocSnap.data();
			const generatedCases = existingData.generatedCaseCache || [];

			// 3. Find the exact object within the array that needs to be removed.
			const caseToRemove = generatedCases.find((c: any) => c.tmpId === generatedId);

			// 4. If the object is found, use arrayRemove to update the document.
			if (caseToRemove) {
				await updateDoc(editDocRef, {
					generatedCaseCache: arrayRemove(caseToRemove)
				});
				return json({ message: 'Case removed successfully.' });
			} else {
				// If the case isn't found, it might have been removed already. This is not an error.
				return json({ message: 'Case not found in cache, no action taken.' });
			}
		}

		// Handle other or unknown actions
		throw error(400, `Unknown action: ${action}`);
	} catch {
		throw error(500, 'Failed to update the edit case cache.');
	}
};
