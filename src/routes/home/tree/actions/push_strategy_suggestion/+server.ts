import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { changeSchema } from '$lib/server/schemas';
import Joi from 'joi';
import { randomUUID } from 'crypto';

export const POST: RequestHandler = async ({
	request,
	locals: { supabase, supabaseService, getSession }
}) => {
	try {
		const { id, newChanges, section, userId } = await request.json();

		const idValid = Joi.string().validate(id);
		const sectionValid = Joi.string().validate(section);
		const userIdValid = Joi.string().validate(userId);
		if (idValid.error || sectionValid.error || userIdValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		setTimeout(async () => {
			const uuid = randomUUID();
			await supabaseService.from('Strategies').update({ last_edit: uuid }).eq('id', id);

			fetch('https://aisafetysphere.com/home/tree/actions/continue_timeout_strategy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id, timeElapsed: 9200, uuid })
			});
		}, 9000);

		const strategiesPromise = supabase
			.from('Strategies')
			.select('tldr, content, suggestions')
			.eq('id', id);
		const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);

		const [strategyResult, usernameResult] = await Promise.all([
			strategiesPromise,
			usernamePromise
		]);

		if (strategyResult?.error) throw { status: 400, message: strategyResult.error.message };
		if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };

		const suggestions = strategyResult.data[0].suggestions;
		const username = usernameResult.data[0].username;

		let suggestion = suggestions.find((s: any) => s.title === section);
		if (!suggestion) {
			if (
				section === 'TL;DR' ||
				strategyResult.data[0].content.find((b: any) => b.title === section)
			) {
				suggestion = { title: section, changes: [] };
				suggestions.push(suggestion);
			} else {
				throw { status: 400, message: 'Bad request: missing or incorrect fields' };
			}
		}
		const changes = suggestion.changes;

		let changeI = 0;
		for (let newChange of newChanges) {
			const changeValid = changeSchema.validate(newChange);
			if (changeValid.error)
				throw { status: 400, message: 'Bad request: missing or incorrect fields' };

			if (newChange.owner === changes[changeI]?.owner) {
				changeI++;
			} else if (newChange.owner !== username) {
				throw { status: 400, message: 'Unauthorized' };
			}
		}
		suggestion.changes = newChanges;

		const { error } = await supabaseService.from('Strategies').update({ suggestions }).eq('id', id);

		if (error) throw { status: 400, message: error.message };

		return json({ message: 'Edit successfully pushed!' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error?.message || 'An unexpected error occurred' },
			{ status: error?.status || 500 }
		);
	}
};
