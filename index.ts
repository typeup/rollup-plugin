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
	const extensions = options.extensions ?? ["tup"]
	return {
		name: "@typeup/rollup-plugin",
		async transform(source, id) {
			const imports: Record<string, mendly.Uri> = {}
			function getName(uri: mendly.Uri, prefix?: string): string {
				const result = (prefix ? prefix + "_" : "") + uri.name?.replace(".tup", "")
				const current = imports[result]
				return current != undefined && current.toString() != uri.toString() ? getName(uri.parent, result) : result
			}
			const url = mendly.Uri.parse(id)
			let result: TypeupTransformResult | null = null
			if (url && extensions.some(extension => url.extension == extension)) {
				let serialized: string
				try {
					serialized = JSON.stringify(
						await parser.parse(source, undefined, (locator: mendly.Uri) => {
							const result = getName(locator)
							imports[result] = locator
							return result
						})
					)
				} catch (error) {
					throw new TypeError(
						`Parser result for "${id}" is not JSON-serializable: ${error instanceof Error ? error.message : String(error)}`
					)
				}
				result = {
					code: `${Object.entries(imports)
						.map(([key, value]) => `import ${key} from "${value}";`)
						.join(
							"\n"
						)}\nimport { dom } from "@typeup/dom";\nexport default dom.Document.hydrate(${serialized.replaceAll(/\{[^{}]*"class":"block\.import"[^{}]*}/g, fixImports)});`
				}
			}
			return result
		}
	} satisfies TypeupRollupPlugin
}
function fixImports(match: string): string {
	let result = match
	try {
		const parsed = JSON.parse(match) as { class?: unknown; source?: unknown; content?: unknown }
		if (
			parsed.class == "block.import"
			&& typeof parsed.source == "string"
			&& typeof parsed.content == "string"
			&& /^[a-zA-Z0-9_]+$/.test(parsed.content)
		)
			result = `{"class":"block.import","source":${JSON.stringify(parsed.source)},"content":${parsed.content}}`
	} catch {}
	return result
}
