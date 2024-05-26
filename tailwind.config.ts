import type { Config } from 'tailwindcss';

export default {
	darkMode: 'class',
	mode: 'jit',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {}
	},
	plugins: []
} satisfies Config;
