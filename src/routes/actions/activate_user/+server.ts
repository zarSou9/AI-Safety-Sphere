import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Joi from 'joi';

export const POST: RequestHandler = async ({ request, locals: { supabaseService, supabase } }) => {
	try {
		const { userId, uuid } = await request.json();

		const userIdValid = Joi.string().validate(userId);
		const uuidValid = Joi.string().validate(uuid);

		if (userIdValid.error || uuidValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		const nodePromise = await supabase
			.from('Nodes')
			.select('last_edit, active_user')
			.eq('uuid', uuid);
		const usernamePromise = supabase.from('Profiles').select('username').eq('user_id', userId);

		const [nodeResult, usernameResult] = await Promise.all([nodePromise, usernamePromise]);

		if (nodeResult.error) throw { status: 400, message: nodeResult.error.message };
		if (usernameResult.error) throw { status: 400, message: usernameResult.error.message };
		let username = usernameResult.data[0].username;

		if (nodeResult.data[0].active_user && nodeResult.data[0].active_user !== username) {
			if (Date.now() - nodeResult.data[0].last_edit < 100000) {
				throw { status: 400, message: 'Another user is currently editing this node' };
			}
		}

		const { error } = await supabaseService
			.from('Nodes')
			.update({ active_user: username, last_edit: Date.now() })
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
