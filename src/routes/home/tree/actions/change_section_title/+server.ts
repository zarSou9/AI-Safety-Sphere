import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Joi from 'joi';
import { createTree } from '$lib/stores/nodes';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { id, i, sectionTitle, userId } = await request.json();

		const idValid = Joi.string().validate(id);
		const sectionValid = Joi.string().max(28).validate(sectionTitle);
		const userIdValid = Joi.string().validate(userId);
		const iValid = Joi.number().min(1).validate(i);

		if (idValid.error || sectionValid.error || userIdValid.error || iValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const problemPromise = supabase.from('Problems').select('content, suggestions').eq('id', id);
		const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);
		const treePromise = supabase.from('Tree').select('data').eq('id', 1);

		const [problemResult, usernameResult, treeResult] = await Promise.all([
			problemPromise,
			usernamePromise,
			treePromise
		]);

		if (problemResult?.error) throw { status: 400, message: problemResult.error.message };
		if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };
		if (treeResult?.error) throw { status: 400, message: treeResult.error.message };

		const content = problemResult.data[0].content;
		const suggestions = problemResult.data[0].suggestions;
		const username = usernameResult.data[0].username;
		const tree = createTree();

		tree.setTree(treeResult.data[0].data);
		const treeNode = tree.getObjFromId(id);
		const owners = treeNode?.owners;
		if (!owners?.includes(username)) {
			throw { status: 400, message: 'Unauthorized' };
		}

		if (content.find((sect: any) => sect.title === sectionTitle))
			throw { status: 400, message: 'Sections must be unique' };

		const prevTitle = content[i - 1].title;
		content[i - 1].title = sectionTitle;
		const sug = suggestions.find((s: any) => s.title === prevTitle);
		if (sug) sug.title = sectionTitle;

		const { error } = await supabaseService
			.from('Problems')
			.update({ content, suggestions })
			.eq('id', id);
		if (error) throw { status: 400, message: error.message };

		return json({ message: 'Edit successfully pushed!' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error.message || 'An unexpected error occurred' },
			{ status: error.status || 500 }
		);
	}
};
