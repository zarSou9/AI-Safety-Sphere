import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createTree } from '$lib/stores/nodes';
import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { stratId, title, userId } = await request.json();

		const userIdValid = Joi.string().validate(userId);
		const stratIdValid = Joi.string().validate(stratId);
		const titleValid = Joi.string().max(28).validate(title);

		if (userIdValid.error || stratIdValid.error || titleValid.error)
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

		const sId = tree.getObjFromId(stratId)?.id;

		if (!sId) throw { status: 400, message: 'Parent strategy of problem node could not be found' };

		const id = tree.createProblem(sId, title, false, undefined, [username], true);
		if (!id) throw { status: 400, message: 'error occured while creating problem' };

		let j = id.length - 1;
		let c = '0';

		while (c !== 's' && c !== 'p' && j >= 0) {
			c = id.charAt(j);
			j--;
		}
		const problemLen = Number(id.substring(j + 2));

		if (problemLen > 8)
			throw { status: 400, message: 'Strategies have a maximum of 8 subproblems' };

		const problemsPromise = supabaseService
			.from('Problems')
			.insert({ id, title, tldr: { ops: [] } });
		const treePromise = supabaseService.from('Tree').update({ data: tree.getTree() }).eq('id', 1);
		const [problemsResult, treeResult] = await Promise.all([problemsPromise, treePromise]);

		if (problemsResult?.error) throw { status: 400, message: problemsResult.error.message };
		if (treeResult?.error) throw { status: 400, message: treeResult.error.message };

		return json({ message: 'Data submitted successfully' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error?.message || 'An unexpected error occurred' },
			{ status: error?.status || 500 }
		);
	}
};
