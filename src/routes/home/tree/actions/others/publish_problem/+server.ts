import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { problems } from '$lib/server/schemas';
import { createTree } from '$lib/stores/nodes';
import type { TrackChanges, Problem } from '$lib/types/nodes';

export const POST: RequestHandler = async ({
	request,
	locals: { supabase, supabaseService, getSession }
}) => {
	try {
		const data: { problem: Problem; changes: TrackChanges } = await request.json();

		if (!data?.problem || !data?.changes) {
			throw { status: 400, message: 'Bad Request: Missing required fields' };
		}
		const tree = createTree();

		const session = await getSession();
		const treeDataPromise = supabase.from('Tree').select('data').eq('id', 1);
		const userPromise = supabase.auth.getUser();
		const usernamePromise = supabase
			.from('Profiles')
			.select('username')
			.eq('user_id', session?.user.id);
		const ownersPromise = supabaseService
			.from('Node_Ownership')
			.select('owners')
			.eq('id', tree.getParent(data.problem.id));

		const [treeData, userResult, usernameResult, ownersResult] = await Promise.all([
			treeDataPromise,
			userPromise,
			usernamePromise,
			ownersPromise
		]);

		if (treeData?.error) throw { status: 400, message: treeData.error.message };
		if (userResult?.error) throw { status: 400, message: userResult.error.message };
		if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };
		if (ownersResult?.error) throw { status: 400, message: ownersResult.error.message };

		const user = userResult.data.user;
		const username = usernameResult.data[0].username;
		const owners = ownersResult.data[0].owners;

		if (!owners.includes(user.id)) throw { status: 400, message: 'Permission denied' };

		const p = problems.validate([data.problem]);

		if (p?.error) throw { status: 400, message: p.error.message };

		tree.setTree(treeData.data[0].data);
		const sId = tree.getObjFromId(tree.getParent(p.value[0].id))?.id;

		if (!sId) throw { status: 400, message: 'Parent strategy of problem node could not be found' };

		tree.createProblem(sId, p.value[0].title, false, p.value[0].tldr, [username], true);

		data.changes.new = data.changes.new.filter((id) => id !== p.value[0].id);
		data.changes.nodes = data.changes.nodes.filter((n) => n.id !== p.value[0].id);

		if (!user) throw { status: 400, message: "couldn't find user" };

		let ownership = [];
		ownership.push({ id: p.value[0].id, owners: [user.id] });

		const ownershipPromise = supabaseService.from('Node_Ownership').insert(ownership);
		const problemsPromise = supabaseService.from('Problems').insert(p.value);
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
