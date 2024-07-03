import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Joi from 'joi';
import { createTree } from '$lib/stores/nodes';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { uuid, i, sectionTitle, userId } = await request.json();

		const sectionValid = Joi.string().max(28).validate(sectionTitle);
		const userIdValid = Joi.string().validate(userId);
		const iValid = Joi.number().min(1).validate(i);
		const uuidValid = Joi.string().validate(uuid);

		if (sectionValid.error || userIdValid.error || iValid.error || uuidValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const problemPromise = supabase.from('Nodes').select('content').eq('uuid', uuid);
		const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);
		const treePromise = supabaseService.from('Tree').select('data').eq('id', 1);

		const [problemResult, usernameResult, treeResult] = await Promise.all([
			problemPromise,
			usernamePromise,
			treePromise
		]);

		if (problemResult?.error) throw { status: 400, message: problemResult.error.message };
		if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };
		if (treeResult?.error) throw { status: 400, message: treeResult.error.message };

		const content = problemResult.data[0].content;
		const username = usernameResult.data[0].username;
		const tree = createTree();

		tree.setTree(treeResult.data[0].data);
		const treeNode = tree.getObjFromId(uuid);
		if (!treeNode) throw { status: 400, message: 'Node does not exist' };

		const owners = treeNode?.owners;
		if (
			!owners?.includes(username) &&
			!(treeNode.members?.includes(username) && treeNode.memberPermissions === 'Can edit')
		) {
			throw { status: 400, message: 'Unauthorized' };
		}

		if (content.find((sect: any) => sect.title === sectionTitle))
			throw { status: 400, message: 'Sections must be unique' };

		content[i - 1].title = sectionTitle;

		const { error } = await supabaseService.from('Nodes').update({ content }).eq('uuid', uuid);
		if (error) throw { status: 400, message: error.message };

		return json({ message: 'Edit successfully pushed!' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error?.message || 'An unexpected error occurred' },
			{ status: error?.status || 500 }
		);
	}
};
