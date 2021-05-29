import { mdsvex } from "mdsvex";
import { mdsvexConfig } from "./mdsvex.config.js";
import adapterStatic from '@sveltejs/adapter-static';
import { svelteShiki } from "svelte-shiki";

const shikiOptions = {
	theme: "nord",
	langs: "bash"
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: [".svelte", ...mdsvexConfig.extensions],
	preprocess: [
		mdsvex(mdsvexConfig),
		svelteShiki(),
	],
	kit: {
		adapter: adapterStatic(),
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',
		hydrate: false,
		router: false,
		floc: false,
		amp: false,
	}
};

export default config;
