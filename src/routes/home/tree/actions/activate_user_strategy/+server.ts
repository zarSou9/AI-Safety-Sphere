import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Joi from 'joi';
import { randomUUID } from 'crypto';

export const POST: RequestHandler = async ({ request, locals: { supabaseService } }) => {
	try {
		const { id, color, username, userColors } = await request.json();

		const idValid = Joi.string().validate(id);
		const usernameValid = Joi.string().validate(username);
		const colorValid = Joi.string().validate(color);

		if (idValid.error || usernameValid.error || colorValid.error)
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

		if (color) userColors.push({ color, user: username });

		const { error } = await supabaseService
			.from('Strategies')
			.update({ active_user: username, userColors })
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
