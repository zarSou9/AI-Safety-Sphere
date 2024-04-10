import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createTree } from '$lib/stores/nodes';
import type { TrackChanges } from '$lib/types/nodes';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const data: { problemId: string; changes: TrackChanges } = await request.json();

		if (!data?.problemId || !data?.changes) {
			throw { status: 400, message: 'Missing required fields' };
		}

		if (data.problemId === 'r') throw { status: 400, message: 'Cannot delete root problem' };

		const treeDataPromise = supabase.from('Tree').select('data').eq('id', 1);
		const ownersPromise = supabaseService
			.from('Node_Ownership')
			.select('owners')
			.eq('id', data.problemId);
		const userPromise = supabase.auth.getUser();

		const [treeData, ownersResult, userResult] = await Promise.all([
			treeDataPromise,
			ownersPromise,
			userPromise
		]);

		if (ownersResult?.error) throw { status: 400, message: ownersResult.error.message };
		if (treeData?.error) throw { status: 400, message: treeData.error.message };
		if (userResult?.error) throw { status: 400, message: userResult.error.message };

		const user = userResult.data.user;
		const owners = ownersResult.data[0]?.owners;

		if (owners?.length) {
			if (!owners.includes(user.id)) throw { status: 400, message: 'permission denied' };
		}

		const tree = createTree();
		tree.setTree(treeData.data[0].data);
		const deletionResult = tree.deleteProblem(data.problemId);

		if (deletionResult?.error) throw { status: 400, message: deletionResult.error };

		data.changes.new = data.changes.new.filter((id) => id !== data.problemId);
		data.changes.nodes = data.changes.nodes.filter((no) => no.id !== data.problemId);

		if (!user) throw { status: 400, message: "couldn't find user" };

		const ownershipPromise = supabaseService
			.from('Node_Ownership')
			.delete()
			.eq('id', data.problemId);
		const problemsPromise = supabaseService.from('Problems').delete().eq('id', data.problemId);
		const treePromise = supabaseService.from('Tree').update({ data: tree.getTree() }).eq('id', 1);
		const profilePromise = supabase
			.from('Profiles')
			.update({ changes: data.changes })
			.eq('user_id', user.id);

		const [ownershipResult, problemsResult, treeResult, profileResult] = await Promise.all([
			ownershipPromise,
			problemsPromise,
			treePromise,
			profilePromise
		]);

		if (ownershipResult?.error) throw { status: 400, message: ownershipResult.error.message };
		if (problemsResult?.error) throw { status: 400, message: problemsResult.error.message };
		if (treeResult?.error) throw { status: 400, message: treeResult.error.message };
		if (profileResult?.error) throw { status: 400, message: profileResult.error.message };

		return json(
			{
				message: 'Problem deleted successfully',
				newChanges: data.changes,
				newTree: tree.getTree()
			},
			{ status: 200 }
		);
	} catch (error: any) {
		return json(
			{ error: error.message || 'An unexpected error occurred' },
			{ status: error.status || 500 }
		);
	}
};
