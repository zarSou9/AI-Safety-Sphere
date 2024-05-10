import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createTree } from '$lib/stores/nodes';
import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { stratId, stratUUID, p, userId } = await request.json();

		const userIdValid = Joi.string().validate(userId);
		const stratIdValid = Joi.string().validate(stratId);
		const pValid = Joi.object({
			title: Joi.string(),
			id: Joi.string(),
			uuid: Joi.string()
		}).validate(p);

		if (userIdValid.error || stratIdValid.error || pValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const treeDataPromise = supabase.from('Tree').select('data').eq('id', 1);
		const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);

		const [treeData, usernameResult] = await Promise.all([treeDataPromise, usernamePromise]);

		if (treeData?.error) throw { status: 400, message: treeData.error.message };
		if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };

		const username = usernameResult.data[0].username;

		const tree = createTree();

		tree.setTree(treeData.data[0].data);
		const treeNode = tree.getObjFromId(stratId);
		const owners = treeNode?.owners;
		if (!owners?.includes(username)) {
			throw { status: 400, message: 'Unauthorized' };
		}

		const s = tree.getObjFromId(stratId, stratUUID);
		if (!s?.id)
			throw { status: 400, message: 'Parent strategy of problem node could not be found' };

		tree.createLinkedProblem(stratId, stratUUID, p.uuid, username);

		if (s.problems.length > 8)
			throw { status: 400, message: 'Strategies have a maximum of 8 subproblems' };

		const treeResult = await supabaseService
			.from('Tree')
			.update({ data: tree.getTree() })
			.eq('id', 1);

		if (treeResult?.error) throw { status: 400, message: treeResult.error.message };

		return json(
			{ message: 'Data submitted successfully', data: { tree: tree.getTree() } },
			{ status: 200 }
		);
	} catch (error: any) {
		return json(
			{ error: error?.message || 'An unexpected error occurred' },
			{ status: error?.status || 500 }
		);
	}
};
