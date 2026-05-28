/// <reference types="vitest/config" />
import { defineConfig } from "vite"

function ensureFileExtensions() {
	const extensionlessRelativeImport = /((?:import|export)\s[^"'`]*?from\s*["'])(\.{1,2}\/[^"']+?)(["'])/g
	const extensionlessDynamicImport = /(import\(\s*["'])(\.{1,2}\/[^"']+?)(["']\s*\))/g
	const hasExtension = /\.[a-zA-Z0-9]+(?:[?#].*)?$/

	function appendJsExtension(specifier: string): string {
		if (hasExtension.test(specifier)) return specifier
		if (specifier.endsWith("/")) return specifier + "index.js"
		return specifier + ".js"
	}

	return {
		name: "ensure-file-extensions",
		renderChunk(code: string) {
			const staticRewritten = code.replace(
				extensionlessRelativeImport,
				(_full, prefix: string, specifier: string, suffix: string) => {
					return prefix + appendJsExtension(specifier) + suffix
				}
			)
			const dynamicRewritten = staticRewritten.replace(
				extensionlessDynamicImport,
				(_full, prefix: string, specifier: string, suffix: string) => {
					return prefix + appendJsExtension(specifier) + suffix
				}
			)
			return dynamicRewritten === code ? null : { code: dynamicRewritten, map: null }
		}
	}
}

export default defineConfig({
	build: {
		target: "node20",
		sourcemap: true,
		lib: { entry: "index.ts", formats: ["es"], fileName: "index" },
		rollupOptions: {
			external: ["@typeup/parser", "mendly/node"],
			plugins: [ensureFileExtensions()],
			output: { entryFileNames: "[name].js", chunkFileNames: "[name]-[hash].js" }
		}
	},
	test: {
		typecheck: { tsconfig: "./tsconfig.json" },
		coverage: {
			reporter: ["text", "json", "html"],
			enabled: true,
			cleanOnRerun: true,
			thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 }
		},
		globals: true,
		include: ["**/*.spec.[tj]s"],
		testTimeout: 20000,
		isolate: false,
		exclude: ["node_modules", "dist"],
		server: { deps: { inline: ["isly"] } }
	}
})
