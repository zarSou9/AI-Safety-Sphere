import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { changeSchema } from '$lib/server/schemas';
import Joi from 'joi';
import { randomUUID } from 'crypto';
import axios from 'axios';

export const POST: RequestHandler = async ({
	request,
	locals: { supabase, supabaseService, getSession }
}) => {
	try {
		const { id, uuid, newChanges, section, userId } = await request.json();

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

		const { error } = await supabaseService
			.from('Strategies')
			.update({ suggestions })
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
