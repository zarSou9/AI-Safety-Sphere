import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Joi from 'joi';
import { createTree } from '$lib/stores/nodes';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { uuid, i, sectionTitle, userId } = await request.json();

		const sectionValid = Joi.string().max(28).validate(sectionTitle);
		const userIdValid = Joi.string().validate(userId);
		const iValid = Joi.number().min(0).validate(i);
		const uuidValid = Joi.string().validate(uuid);

		if (sectionValid.error || userIdValid.error || iValid.error || uuidValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		while (true) {
			const now = Date.now();
			const nowCompare = now - 10000;

			const last_edit = Date.now();

			const problemPromise = supabase.from('Nodes').select('content').eq('uuid', uuid);
			const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);
			const treePromise = supabaseService
				.from('Tree')
				.update({ changing: now })
				.lt('changing', nowCompare)
				.select('data');

			const [problemResult, usernameResult, treeResult] = await Promise.all([
				problemPromise,
				usernamePromise,
				treePromise
			]);

			if (problemResult?.error) throw { status: 400, message: problemResult.error.message };
			if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };
			if (treeResult?.error) throw { status: 400, message: treeResult.error.message };

			if (!treeResult.data.length) continue;

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

			if (
				content.find((sect: any) => sect.title === sectionTitle) ||
				treeNode.data.tldr_title === sectionTitle
			)
				throw { status: 400, message: 'Sections must be unique' };

			const postPromises = [];

			if (!i) treeNode.data.tldr_title = sectionTitle;
			else {
				content[i - 1].title = sectionTitle;
				postPromises.push(
					supabaseService.from('Nodes').update({ content, last_edit }).eq('uuid', uuid)
				);
			}

			postPromises.push(
				supabaseService.from('Tree').update({ changing: 0, data: tree.getTree() }).eq('id', 1)
			);
			const results = await Promise.all(postPromises);

			results.forEach((result) => {
				if (result.error) throw { status: 400, message: result.error.message };
			});

			break;
		}

		return json({ message: 'Edit successfully pushed!' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error?.message || 'An unexpected error occurred' },
			{ status: error?.status || 500 }
		);
	}
};
