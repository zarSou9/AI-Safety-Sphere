import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createTree } from '$lib/stores/nodes';
import type { TrackChanges } from '$lib/types/nodes';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const data: { strategyId: string; changes: TrackChanges } = await request.json();

		if (!data?.strategyId || !data?.changes) {
			throw { status: 400, message: 'Bad Request: Missing required fields' };
		}

		const treeDataPromise = supabase.from('Tree').select('data').eq('id', 1);
		const ownersPromise = supabaseService
			.from('Node_Ownership')
			.select('owners')
			.eq('id', data.strategyId);
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
			if (!owners.includes(user.id)) throw { status: 400, message: 'Permission denied' };
		}

		const tree = createTree();
		tree.setTree(treeData.data[0].data);
		const deletionResult = tree.deleteStrategy(data.strategyId);

		if (deletionResult?.error) throw { status: 400, message: deletionResult.error };

		data.changes.new = data.changes.new.filter((id) => id !== data.strategyId);
		data.changes.nodes = data.changes.nodes.filter((no) => no.id !== data.strategyId);

		if (!user) throw { status: 400, message: "Couldn't find user" };

		const ownershipPromise = supabaseService
			.from('Node_Ownership')
			.delete()
			.eq('id', data.strategyId);
		const strategiesPromise = supabaseService.from('Strategies').delete().eq('id', data.strategyId);
		const treePromise = supabaseService.from('Tree').update({ data: tree.getTree() }).eq('id', 1);
		const profilePromise = supabase
			.from('Profiles')
			.update({ changes: data.changes, selected_strategies: [] })
			.eq('user_id', user.id);

		const [ownershipResult, strategiesResult, treeResult, profileResult] = await Promise.all([
			ownershipPromise,
			strategiesPromise,
			treePromise,
			profilePromise
		]);

		if (ownershipResult?.error) throw { status: 400, message: ownershipResult.error.message };
		if (strategiesResult?.error) throw { status: 400, message: strategiesResult.error.message };
		if (treeResult?.error) throw { status: 400, message: treeResult.error.message };
		if (profileResult?.error) throw { status: 400, message: profileResult.error.message };

		return json(
			{
				message: 'Strategy deleted successfully',
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
