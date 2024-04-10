import { fail, type Actions } from '@sveltejs/kit';

export const actions: Actions = {
	signup: async ({ request, locals: { supabase, supabaseService } }) => {
		const formData = await request.formData();

		const username = formData.get('username') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!username || !email || !password) {
			let mess = '';
			if (!username) mess += 'username';
			for (let i = 0; i < 2; i++) {
				if (i === 0 && !email) {
					if (mess.length) mess += ', ';
					mess += 'email';
				} else if (i === 1 && !password) {
					if (mess.length) mess += ', ';
					mess += 'password';
				}
			}
			return fail(500, {
				message: 'Missing required field/s: ' + mess
			});
		}

		const usernamePromise = supabaseService
			.from('Profiles')
			.select('username')
			.eq('username', username);
		const emailPromise = supabaseService.from('Profiles').select('email').eq('email', email);

		const [usernameResult, emailResult] = await Promise.all([usernamePromise, emailPromise]);

		if (usernameResult?.error) {
			return fail(500, {
				message: usernameResult.error.message
			});
		}
		if (emailResult?.error) {
			return fail(500, {
				message: emailResult.error.message
			});
		}

		if (usernameResult?.data[0]?.username) {
			return fail(400, {
				email,
				message: 'Username taken!'
			});
		}
		if (emailResult?.data[0]?.email) {
			return fail(400, {
				username,
				message: 'Email already registered!'
			});
		}

		const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: 'http://localhost:5173/login',
				data: { email, username }
			}
		});
		if (signUpError) {
			return fail(500, {
				message: signUpError.message
			});
		}

		const { error: profileError } = await supabaseService
			.from('Profiles')
			.insert([{ user_id: signUpData?.user?.id, username, email }]);

		if (profileError) {
			return fail(500, {
				message: profileError.message
			});
		}

		return {
			success: true
		};
	}
};
