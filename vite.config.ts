import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
	plugins: [svelte()],
	resolve: {
		alias: {
			"@": path.join(__dirname, "src"),
		},
	},
	css: {
		preprocessorOptions: {
			scss: {
				api: "modern-compiler",
			},
		},
		lightningcss: {
			targets: browserslistToTargets(browserslist("> 0.1%, last 4 versions, not dead")),
		},
	},
	build: {
		sourcemap: false,
		cssMinify: "lightningcss",
		rollupOptions: {
			treeshake: true,
			output: {
				advancedChunks: {
					groups: [{ name: "three", test: /node_modules\/three/ }],
				},
			},
		},
	},
});
