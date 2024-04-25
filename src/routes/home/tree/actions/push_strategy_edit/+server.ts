import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { changeSchema, delta } from '$lib/server/schemas';
import Joi from 'joi';
import { createTree } from '$lib/stores/nodes';
import { randomUUID } from 'crypto';
import axios from 'axios';

export const POST: RequestHandler = async ({
	request,
	locals: { supabase, supabaseService, getSession }
}) => {
	try {
		const { id, uuid, base, newChanges, section, userId } = await request.json();

		const idValid = Joi.string().validate(id);
		const sectionValid = Joi.string().validate(section);
		const userIdValid = Joi.string().validate(userId);
		const uuidValid = Joi.string().validate(uuid);

		if (idValid.error || sectionValid.error || userIdValid.error || uuidValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const last_edit = randomUUID();

		axios.post(
			'https://aisafetysphere.com/home/tree/actions/continue_timeout_strategy',
			{
				uuid,
				timeElapsed: 70,
				last_edit
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
		supabaseService.from('Strategies').update({ last_edit }).eq('uuid', uuid);

		const strategiesPromise = supabase
			.from('Strategies')
			.select('tldr, content, suggestions')
			.eq('uuid', uuid);
		const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);
		const treePromise = supabase.from('Tree').select('data').eq('id', 1);

		const [strategyResult, usernameResult, treeResult] = await Promise.all([
			strategiesPromise,
			usernamePromise,
			treePromise
		]);

		if (strategyResult?.error) throw { status: 400, message: strategyResult.error.message };
		if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };
		if (treeResult?.error) throw { status: 400, message: treeResult.error.message };

		const suggestions = strategyResult.data[0].suggestions;
		const username = usernameResult.data[0].username;
		const tree = createTree();

		tree.setTree(treeResult.data[0].data);
		const treeNode = tree.getObjFromId(id, uuid);
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
			const strategyPostPromise = supabaseService
				.from('Strategies')
				.update({ tldr: base, suggestions })
				.eq('uuid', uuid);

			const [strategyPostResult, treePostResult] = await Promise.all([
				strategyPostPromise,
				treePostPromise
			]);
			if (strategyPostResult?.error)
				throw { status: 400, message: strategyPostResult.error.message };
			if (treePostResult?.error) throw { status: 400, message: treePostResult.error.message };
		} else {
			const content = strategyResult.data[0].content;
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
				.from('Strategies')
				.update({ content, suggestions })
				.eq('uuid', uuid);
			if (error) throw { status: 400, message: error.message };
		}

		return json({ message: 'Edit successfully pushed!' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error?.message || 'An unexpected error occurred' },
			{ status: error?.status || 500 }
		);
	}
};
