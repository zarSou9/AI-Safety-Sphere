import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { delta, tldrDelta } from '$lib/server/schemas';
import Joi from 'joi';
import { createTree } from '$lib/stores/nodes';
import Delta from 'quill-delta';

export const POST: RequestHandler = async ({ request, locals: { supabase, supabaseService } }) => {
	try {
		const { uuid, base, section, userId } = await request.json();

		const sectionValid = Joi.string().validate(section);
		const userIdValid = Joi.string().validate(userId);
		const uuidValid = Joi.string().validate(uuid);

		if (sectionValid.error || userIdValid.error || uuidValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		while (true) {
			const now = Date.now();
			const nowCompare = now - 10000;

			const last_edit = Date.now();

			const nodePromise = supabase
				.from('Nodes')
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
			const treeNode = tree.getObjFromId(uuid);
			if (!treeNode) throw { status: 400, message: 'Node does not exist' };

			const owners = treeNode?.owners;
			if (!owners?.includes(username)) {
				throw { status: 400, message: 'Unauthorized' };
			}
			if (username !== nodeResult.data[0].active_user)
				throw { status: 400, message: 'Another user is currently editing this node' };

			let baseValid;
			if (section === 'TL;DR') {
				baseValid = tldrDelta.validate(base);
				if (baseValid.error)
					throw { status: 400, message: 'Bad request: missing or incorrect fields' };

				const dbase = new Delta(base);
				let i = 0;
				dbase.eachLine(() => {
					i += 1;
				});
				if (i > 14) throw { status: 400, message: 'The TL;DR section is limited to 12 lines' };

				treeNode.data.tldr = base;
				const treePostPromise = supabaseService
					.from('Tree')
					.update({ data: tree.getTree(), changing: 0 })
					.eq('id', 1);
				const nodePostPromise = supabaseService
					.from('Nodes')
					.update({ tldr: base, last_edit })
					.eq('uuid', uuid);

				const [nodePostResult, treePostResult] = await Promise.all([
					nodePostPromise,
					treePostPromise
				]);
				if (nodePostResult?.error) throw { status: 400, message: nodePostResult.error.message };
				if (treePostResult?.error) throw { status: 400, message: treePostResult.error.message };
			} else {
				const content = nodeResult.data[0].content;
				baseValid = delta.validate(base);
				if (baseValid.error) throw { status: 400, message: baseValid.error.message };

				const sect = content.find((s: any) => s.title === section);
				if (sect) {
					sect.delta = base;
				} else {
					content.push({ title: section, delta: base });
				}
				const nodePostPromise = supabaseService
					.from('Nodes')
					.update({ content, last_edit })
					.eq('uuid', uuid);
				const treePostPromise = supabaseService.from('Tree').update({ changing: 0 }).eq('id', 1);

				const [nodePostResult, treePostResult] = await Promise.all([
					nodePostPromise,
					treePostPromise
				]);
				if (nodePostResult?.error) throw { status: 400, message: nodePostResult.error.message };
				if (treePostResult?.error) throw { status: 400, message: treePostResult.error.message };
			}
			break;
		}

		return json({ message: 'Edit successfully pushed!' }, { status: 200 });
	} catch (error: any) {
		await supabaseService.from('Tree').update({ changing: 0 }).eq('id', 1);
		return json(
			{ error: error?.message || 'An unexpected error occurred' },
			{ status: error?.status || 500 }
		);
	}
};
