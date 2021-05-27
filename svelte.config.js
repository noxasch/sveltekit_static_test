import { mdsvex } from "mdsvex";
import { mdsvexConfig } from "./mdsvex.config.js";
import adapterStatic from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: [".svelte", ...mdsvexConfig.extensions],
	preprocess: [
		mdsvex(mdsvexConfig),
	],
	kit: {
		adapter: adapterStatic(),
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',
		hydrate: false,
		router: false
	}
};

export default config;
