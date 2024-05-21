import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabaseService, supabase } }) => {
	try {
		const { id, userId, vote } = await request.json();

		const idValid = Joi.string().validate(id);
		const userIdValid = Joi.string().validate(userId);
		const voteValid = Joi.alternatives().try(-1, 0, 1).validate(vote);

		if (idValid.error || userIdValid.error || voteValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const questionsPromise = await supabase
			.from('Questions')
			.select('votes, importance')
			.eq('id', id);
		const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);

		const [questionsResult, usernameResult] = await Promise.all([
			questionsPromise,
			usernamePromise
		]);

		if (questionsResult.error) throw { status: 400, message: questionsResult.error.message };
		if (usernameResult.error) throw { status: 400, message: usernameResult.error.message };

		let username = usernameResult.data[0].username;
		let votes = questionsResult.data[0].votes;
		let importance = questionsResult.data[0].importance;
		let voteFound = votes.find((v: any) => v.user === username);
		if (voteFound) {
			importance -= voteFound.vote;
			if (!vote)
				votes.splice(
					votes.findIndex((v: any) => v.user === username),
					1
				);
			else voteFound.vote = vote;
		} else {
			votes.push({ vote, user: username });
		}
		importance += vote;

		const { error } = await supabaseService
			.from('Questions')
			.update({ votes, importance })
			.eq('id', id);
		if (error) throw { status: 400, message: error.message };

		return json({ message: 'User now active!' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error.message || 'An unexpected error occurred' },
			{ status: error.status || 500 }
		);
	}
};
