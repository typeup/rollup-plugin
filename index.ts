import { parser } from "@typeup/parser"
import { mendly } from "mendly/node"

export interface TypeupRollupPluginOptions {
	extensions?: string[]
}
export interface TypeupTransformResult {
	code: string
}
export interface TypeupRollupPlugin {
	name: string
	transform(source: string, id: string): Promise<TypeupTransformResult | null>
}
export function typeup(options: TypeupRollupPluginOptions = {}): TypeupRollupPlugin {
	const extensions = options.extensions ?? ["tup", "typeup"]
	return {
		name: "@typeup/rollup-plugin",
		async transform(source, id) {
			const imports: Record<string, mendly.Uri> = {}
			function getName(uri: mendly.Uri, prefix?: string): string {
				const result = (prefix ? prefix + "_" : "") + uri.path[uri.path.length - 1]
				const current = imports[result]
				return current != undefined && current.toString() != uri.toString() ? getName(uri, result) : result
			}
			const url = mendly.Uri.parse(id)
			let result: TypeupTransformResult | null = null
			if (url && extensions.some(extension => url.path[url.path.length - 1]?.endsWith("." + extension))) {
				let serialized: string
				try {
					serialized = JSON.stringify(await parser.parse(source, undefined, (locator: mendly.Uri) => getName(locator)))
				} catch (error) {
					throw new TypeError(
						`Parser result for "${id}" is not JSON-serializable: ${error instanceof Error ? error.message : String(error)}`
					)
				}
				result = {
					code: `${Object.entries(imports)
						.map(([key, value]) => `import ${key} from "${value}";`)
						.join("\n")}\nexport default ${serialized /*.replace(/content: "(.*)"/, 'content: $1')*/};`
				}
			}
			return result
		}
	} satisfies TypeupRollupPlugin
}
