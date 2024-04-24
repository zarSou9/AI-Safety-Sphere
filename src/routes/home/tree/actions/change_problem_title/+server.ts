import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Joi from 'joi';
import { createTree } from '$lib/stores/nodes';

export const POST: RequestHandler = async ({
	request,
	locals: { supabase, supabaseService, getSession }
}) => {
	try {
		const { id, uuid, newTitle, userId } = await request.json();

		const newTitleValid = Joi.string().max(28).validate(newTitle);
		const uuidValid = Joi.string().validate(uuid);

		if (newTitleValid.error || uuidValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);
		const treePromise = supabase.from('Tree').select('data').eq('id', 1);

		const [usernameResult, treeResult] = await Promise.all([usernamePromise, treePromise]);

		if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };
		if (treeResult?.error) throw { status: 400, message: treeResult.error.message };

		const username = usernameResult.data[0].username;
		const tree = createTree();

		tree.setTree(treeResult.data[0].data);
		const treeNode = tree.getObjFromId(id, uuid);
		const owners = treeNode?.owners;
		if (!owners?.includes(username)) {
			throw { status: 400, message: 'Unauthorized' };
		}

		treeNode.data.title = newTitle;

		const treePostPromise = supabaseService
			.from('Tree')
			.update({ data: tree.getTree() })
			.eq('id', 1);
		const problemPostPromise = supabaseService
			.from('Problems')
			.update({ title: newTitle })
			.eq('uuid', uuid);

		const [problemPostResult, treePostResult] = await Promise.all([
			problemPostPromise,
			treePostPromise
		]);
		if (problemPostResult?.error) throw { status: 400, message: problemPostResult.error.message };
		if (treePostResult?.error) throw { status: 400, message: treePostResult.error.message };

		return json({ message: 'Edit successfully pushed!' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error?.message || 'An unexpected error occurred' },
			{ status: error?.status || 500 }
		);
	}
};
