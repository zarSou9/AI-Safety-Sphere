import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { delta } from '$lib/server/schemas';
import Joi from 'joi';
import { createTree } from '$lib/stores/nodes';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { id, uuid, base, section, userId, location } = await request.json();

		const idValid = Joi.string().validate(id);
		const sectionValid = Joi.string().validate(section);
		const userIdValid = Joi.string().validate(userId);
		const uuidValid = Joi.string().validate(uuid);
		const locationValid = Joi.string().validate(location);

		if (
			idValid.error ||
			sectionValid.error ||
			userIdValid.error ||
			uuidValid.error ||
			locationValid.error
		)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		while (true) {
			const now = Date.now();
			const nowCompare = now - 10000;

			const last_edit = Date.now();

			const nodePromise = supabase
				.from(location)
				.select('tldr, content, active_user')
				.eq('uuid', uuid);
			const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);
			const treePromise = supabaseService
				.from('Tree')
				.update({ changing: now })
				.lt('changing', nowCompare)
				.select('data');

			const [nodeResult, usernameResult, treeResult] = await Promise.all([
				nodePromise,
				usernamePromise,
				treePromise
			]);

			if (nodeResult?.error) throw { status: 400, message: nodeResult.error.message };
			if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };
			if (treeResult?.error) throw { status: 400, message: treeResult.error.message };

			if (!treeResult.data.length) continue;

			const username = usernameResult.data[0].username;
			const tree = createTree();

			tree.setTree(treeResult.data[0].data);
			const treeNode = tree.getObjFromId(id, uuid);
			const owners = treeNode?.owners;
			if (!owners?.includes(username)) {
				throw { status: 400, message: 'Unauthorized' };
			}
			if (username !== nodeResult.data[0].active_user)
				throw { status: 400, message: 'Another user is currently editing this node' };

			let baseValid;
			if (section === 'TL;DR') {
				baseValid = delta.validate(base);
				if (baseValid.error)
					throw { status: 400, message: 'Bad request: missing or incorrect fields' };
				treeNode.data.tldr = base;
				const treePostPromise = supabaseService
					.from('Tree')
					.update({ data: tree.getTree(), changing: 0 })
					.eq('id', 1);
				const problemPostPromise = supabaseService
					.from(location)
					.update({ tldr: base, last_edit })
					.eq('uuid', uuid);

				const [problemPostResult, treePostResult] = await Promise.all([
					problemPostPromise,
					treePostPromise
				]);
				if (problemPostResult?.error)
					throw { status: 400, message: problemPostResult.error.message };
				if (treePostResult?.error) throw { status: 400, message: treePostResult.error.message };
			} else {
				const content = nodeResult.data[0].content;
				baseValid = delta.validate(base);
				if (baseValid.error)
					throw { status: 400, message: 'Bad request: missing or incorrect fields' };

				const sect = content.find((s: any) => s.title === section);
				if (sect) {
					sect.delta = base;
				} else {
					content.push({ title: section, delta: base });
				}
				const { error } = await supabaseService
					.from(location)
					.update({ content, last_edit })
					.eq('uuid', uuid);

				if (error) throw { status: 400, message: error.message };
			}
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
