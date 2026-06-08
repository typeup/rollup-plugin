declare module "*.tup" {
	import type { dom } from "@typeup/dom"

	const document: dom.Document
	export default document
}
