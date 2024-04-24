import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Joi from 'joi';
import { createTree } from '$lib/stores/nodes';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { id, uuid, i, userId } = await request.json();

		const idValid = Joi.string().validate(id);
		const userIdValid = Joi.string().validate(userId);
		const iValid = Joi.number().min(1).validate(i);
		const uuidValid = Joi.string().validate(uuid);

		if (idValid.error || userIdValid.error || iValid.error || uuidValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const strategyPromise = supabase
			.from('Strategies')
			.select('content, suggestions')
			.eq('uuid', uuid);
		const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);
		const treePromise = supabase.from('Tree').select('data').eq('id', 1);

		const [strategyResult, usernameResult, treeResult] = await Promise.all([
			strategyPromise,
			usernamePromise,
			treePromise
		]);

		if (strategyResult?.error) throw { status: 400, message: strategyResult.error.message };
		if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };
		if (treeResult?.error) throw { status: 400, message: treeResult.error.message };

		const content = strategyResult.data[0].content;
		const suggestions = strategyResult.data[0].suggestions;
		const username = usernameResult.data[0].username;
		const tree = createTree();

		tree.setTree(treeResult.data[0].data);
		const treeNode = tree.getObjFromId(id);
		const owners = treeNode?.owners;
		if (!owners?.includes(username)) {
			throw { status: 400, message: 'Unauthorized' };
		}

		const sugI = suggestions.findIndex((s: any) => s.title === content[i - 1].title);
		content.splice(i - 1, 1);
		if (sugI >= 0) suggestions.splice(sugI, 1);

		const { error } = await supabaseService
			.from('Strategies')
			.update({ content, suggestions })
			.eq('uuid', uuid);
		if (error) throw { status: 400, message: error.message };

		return json({ message: 'Edit successfully pushed!' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error?.message || 'An unexpected error occurred' },
			{ status: error?.status || 500 }
		);
	}
};
