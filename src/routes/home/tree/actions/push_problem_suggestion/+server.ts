import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { changeSchema } from '$lib/server/schemas';
import Joi from 'joi';

export const POST: RequestHandler = async ({
	request,
	locals: { supabase, supabaseService, getSession }
}) => {
	try {
		const { id, newChanges, section, userId } = await request.json();

		const idValid = Joi.string().validate(id);
		const sectionValid = Joi.string().validate(id);
		const userIdValid = Joi.string().validate(id);
		if (idValid.error || sectionValid.error || userIdValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const problemPromise = supabase
			.from('Problems')
			.select('tldr, content, suggestions')
			.eq('id', id);
		const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);

		const [problemResult, usernameResult] = await Promise.all([problemPromise, usernamePromise]);

		if (problemResult?.error) throw { status: 400, message: problemResult.error.message };
		if (usernameResult?.error) throw { status: 400, message: usernameResult.error.message };

		const suggestions = problemResult.data[0].suggestions;
		const username = usernameResult.data[0].username;

		let suggestion = suggestions.find((s: any) => s.title === section);
		if (!suggestion) {
			if (
				section === 'TL;DR' ||
				problemResult.data[0].content.find((b: any) => b.title === section)
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

		const { error } = await supabaseService.from('Problems').update({ suggestions }).eq('id', id);

		if (error) throw { status: 400, message: error.message };

		return json({ message: 'Edit successfully pushed!' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error.message || 'An unexpected error occurred' },
			{ status: error.status || 500 }
		);
	}
};
