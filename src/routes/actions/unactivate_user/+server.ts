import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabaseService, supabase } }) => {
	try {
		const { id, userId, uuid, nodeType } = await request.json();

		const idValid = Joi.string().validate(id);
		const userIdValid = Joi.string().validate(userId);
		const uuidValid = Joi.string().validate(uuid);
		const nodeTypeValid = Joi.boolean().validate(nodeType);

		if (idValid.error || userIdValid.error || uuidValid.error || nodeTypeValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		let location;
		if (nodeType) location = 'Problems';
		else location = 'Strategies';

		const problemPromise = await supabase
			.from(location)
			.select('last_edit, active_user')
			.eq('uuid', uuid);
		const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);

		const [problemResult, usernameResult] = await Promise.all([problemPromise, usernamePromise]);

		if (problemResult.error) throw { status: 400, message: problemResult.error.message };
		if (usernameResult.error) throw { status: 400, message: usernameResult.error.message };
		let username = usernameResult.data[0].username;

		if (problemResult.data[0].active_user !== username) {
			throw { status: 400, message: 'Unauthorized' };
		}

		const { error } = await supabaseService
			.from(location)
			.update({ last_edit: 0 })
			.eq('uuid', uuid);
		if (error) throw { status: 400, message: error.message };

		return json({ message: 'User now active!' }, { status: 200 });
	} catch (error: any) {
		return json(
			{ error: error.message || 'An unexpected error occurred' },
			{ status: error.status || 500 }
		);
	}
};
