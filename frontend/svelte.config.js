import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Using adapter-node for better compatibility with free deployment platforms
		// Works with Render, Railway, Fly.io, and other Node.js hosting platforms
		adapter: adapter({
			out: 'build',
		})
	}
};

export default config;

