import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Joi from 'joi';
import { randomUUID } from 'crypto';

export const POST: RequestHandler = async ({ request, locals: { supabaseService } }) => {
	try {
		const { id, uuid, color, username, userColors } = await request.json();

		const idValid = Joi.string().validate(id);
		const usernameValid = Joi.string().validate(username);
		const colorValid = Joi.string().validate(color);
		const uuidValid = Joi.string().validate(uuid);

		if (idValid.error || usernameValid.error || colorValid.error || uuidValid.error)
			throw { status: 400, message: 'Bad request: missing or incorrect fields' };

		if (color) userColors.push({ color, user: username });

		const last_edit = randomUUID();

		fetch('https://aisafetysphere.com/home/tree/actions/continue_timeout', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ uuid, timeElapsed: 70, last_edit })
		});
		const { error } = await supabaseService
			.from('Problems')
			.update({ active_user: username, userColors, last_edit })
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
