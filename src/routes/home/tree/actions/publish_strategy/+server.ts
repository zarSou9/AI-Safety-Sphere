import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { problems, strategies } from '$lib/server/schemas';
import { createTree } from '$lib/stores/nodes';
import type { TrackChanges, Strategy, Problem } from '$lib/types/nodes';

export const POST: RequestHandler = async ({
	request,
	locals: { supabase, supabaseService, getSession }
}) => {
	try {
		const data: { strategy: Strategy; changes: TrackChanges } = await request.json();

		if (!data?.strategy || !data?.changes) {
			throw { status: 400, message: 'Bad Request: Missing required fields' };
		}

		const session = await getSession();
		const treeDataPromise = supabase.from('Tree').select('data').eq('id', 1);
		const userPromise = supabase.auth.getUser();
		const usernamePromise = supabase
			.from('Profiles')
			.select('username')
			.eq('user_id', session?.user.id);

		const [treeData, userResult, usernameResult] = await Promise.all([
			treeDataPromise,
			userPromise,
			usernamePromise
		]);

		if (treeData?.error) throw { status: 400, message: treeData.error.message };
		if (userResult?.error) throw { status: 400, message: userResult.error.message };
		if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };

		const user = userResult.data.user;
		const username = usernameResult.data[0].username;

		const s = strategies.validate([data.strategy]);

		if (s?.error) throw { status: 400, message: s.error.message };

		const tree = createTree();

		tree.setTree(treeData.data[0].data);
		const pId = tree.getObjFromId(tree.getParent(s.value[0].id))?.id;

		if (!pId) throw { status: 400, message: 'Parent problem of strategy node could not be found' };

		tree.createStrategy(pId, s.value[0].title, false, s.value[0].tldr, [username]);

		data.changes.new = data.changes.new.filter((id) => id !== s.value[0].id);
		data.changes.nodes = data.changes.nodes.filter((no) => no.id !== s.value[0].id);

		if (!user) throw { status: 400, message: "couldn't find user" };

		let ownership = [];
		ownership.push({ id: s.value[0].id, owners: [user.id] });

		const ownershipPromise = supabaseService.from('Node_Ownership').insert(ownership);
		const strategiesPromise = supabaseService.from('Strategies').insert(s.value);
		const treePromise = supabaseService.from('Tree').update({ data: tree.getTree() }).eq('id', 1);
		const profilePromise = supabase
			.from('Profiles')
			.update({ changes: data.changes })
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
			{ message: 'Data submitted successfully', newChanges: data.changes },
			{ status: 200 }
		);
	} catch (error: any) {
		return json(
			{ error: error.message || 'An unexpected error occurred' },
			{ status: error.status || 500 }
		);
	}
};
