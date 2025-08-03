import { json, error } from '@sveltejs/kit';
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';

import { db } from '$lib/firebase';

export const GET = async ({ params }) => {
	const docRef = doc(db, 'guilds', params.guildId, 'proposals', params.proposalId);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		return json({
			...docSnap.data(),
			id: docSnap.id,
			createAt: docSnap.data().createAt.toDate()
		});
	}
	throw error(404, `Proposal #${params.proposalId} not found.`);
};

export const PATCH = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(400, 'User authentication error.');
	}
	try {
		const { action = '', caseId, vote, proposalEditId } = await request.json();
		if (action === 'removeCase') {
			await updateDoc(doc(db, 'guilds', params.guildId, 'proposals', params.proposalId), {
				testCases: arrayRemove(caseId)
			});
		} else if (action === 'addCase') {
			await updateDoc(doc(db, 'guilds', params.guildId, 'proposals', params.proposalId), {
				testCases: arrayUnion(caseId)
			});
		} else if (action === 'voteProposal') {
			const userId = locals.user.userId;
			if (vote === 'upvote') {
				await updateDoc(
					doc(
						db,
						'guilds',
						params.guildId,
						'proposals',
						params.proposalId,
						'edits',
						proposalEditId
					),
					{
						upvotes: arrayUnion(userId),
						downvotes: arrayRemove(userId)
					}
				);
			} else if (vote === 'downvote') {
				await updateDoc(
					doc(
						db,
						'guilds',
						params.guildId,
						'proposals',
						params.proposalId,
						'edits',
						proposalEditId
					),
					{
						upvotes: arrayRemove(userId),
						downvotes: arrayUnion(userId)
					}
				);
			} else {
				await updateDoc(
					doc(
						db,
						'guilds',
						params.guildId,
						'proposals',
						params.proposalId,
						'edits',
						proposalEditId
					),
					{
						upvotes: arrayRemove(userId),
						downvotes: arrayRemove(userId)
					}
				);
			}
		} else if (action === 'closeProposal') {
			await updateDoc(doc(db, 'guilds', params.guildId, 'proposals', params.proposalId), {
				open: false
			});
		}
		return json({ status: 201 });
	} catch {
		throw error(400, 'Fail to update the test suite');
	}
};
