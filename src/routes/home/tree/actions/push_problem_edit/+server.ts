import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { changeSchema, delta } from '$lib/server/schemas';
import Joi from 'joi';
import { createTree } from '$lib/stores/nodes';
import { randomUUID } from 'crypto';

export const POST: RequestHandler = async ({
	request,
	locals: { supabase, supabaseService, getSession }
}) => {
	try {
		const { id, base, newChanges, section, userId } = await request.json();

		const idValid = Joi.string().validate(id);
		const sectionValid = Joi.string().validate(section);
		const userIdValid = Joi.string().validate(userId);
		if (idValid.error || sectionValid.error || userIdValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		setTimeout(async () => {
			const uuid = randomUUID();
			await supabaseService.from('Problems').update({ last_edit: uuid }).eq('id', id);

			fetch('http://localhost:5173/home/tree/actions/continue_timeout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id, timeElapsed: 9200, uuid })
			});
		}, 9000);

		const problemPromise = supabase
			.from('Problems')
			.select('tldr, content, suggestions')
			.eq('id', id);
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

		const suggestions = problemResult.data[0].suggestions;
		const username = usernameResult.data[0].username;
		const tree = createTree();

		tree.setTree(treeResult.data[0].data);
		const treeNode = tree.getObjFromId(id);
		const owners = treeNode?.owners;
		if (!owners?.includes(username)) {
			throw { status: 400, message: 'Unauthorized' };
		}

		let suggestion = suggestions.find((s: any) => s.title === section);
		if (!suggestion) {
			suggestion = { title: section, changes: [] };
			suggestions.push(suggestion);
		}

		for (let newChange of newChanges) {
			const changeValid = changeSchema.validate(newChange);
			if (changeValid.error)
				throw { status: 400, message: 'Bad request: missing or incorrect fields' };
		}
		suggestion.changes = newChanges;

		let baseValid;
		if (section === 'TL;DR') {
			baseValid = delta.validate(base);
			if (baseValid.error)
				throw { status: 400, message: 'Bad request: missing or incorrect fields' };
			treeNode.data.tldr = base;
			const treePostPromise = supabaseService
				.from('Tree')
				.update({ data: tree.getTree() })
				.eq('id', 1);
			const problemPostPromise = supabaseService
				.from('Problems')
				.update({ tldr: base, suggestions })
				.eq('id', id);

			const [problemPostResult, treePostResult] = await Promise.all([
				problemPostPromise,
				treePostPromise
			]);
			if (problemPostResult?.error) throw { status: 400, message: problemPostResult.error.message };
			if (treePostResult?.error) throw { status: 400, message: treePostResult.error.message };
		} else {
			const content = problemResult.data[0].content;
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
				.from('Problems')
				.update({ content, suggestions })
				.eq('id', id);
			if (error) throw { status: 400, message: error.message };
		}

		return json({ message: 'Edit successfully pushed!' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error.message || 'An unexpected error occurred' },
			{ status: error.status || 500 }
		);
	}
};
