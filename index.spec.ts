import { afterEach, describe, expect, it, vi } from "vitest"
import { typeup } from "./index"

describe("@typeup/rollup-plugin", () => {
	afterEach(() => vi.restoreAllMocks())

	it("has plugin name", () => expect(typeup().name).toBe("@typeup/rollup-plugin"))

	it.each([
		{ name: "non-matching-extension-ts", id: "file:///tmp/input.ts", source: "content" },
		{
			name: "non-matching-extension-custom-only",
			id: "file:///tmp/input.tup",
			source: "content",
			options: { extensions: ["custom"] }
		},
		{ name: "paragraph", id: "file:///tmp/paragraph.tup", source: "hello" },
		{
			name: "metadata-and-text",
			id: "file:///tmp/metadata.tup",
			source: `title = Example

Simple paragraph.`
		},
		{
			name: "heading",
			id: "file:///tmp/heading.tup",
			source: `# Section

Some text.`
		},
		{
			name: "ordered-list",
			id: "file:///tmp/ordered-list.tup",
			source: `1. One
1. Two`
		},
		{
			name: "unordered-list-dash",
			id: "file:///tmp/unordered-list-dash.tup",
			source: `- One
- Two`
		},
		{
			name: "unordered-list-star",
			id: "file:///tmp/unordered-list-star.tup",
			source: `* One
* Two`
		},
		{
			name: "triple-quote",
			id: "file:///tmp/triple-quote.tup",
			source: `"""
Highlighted.
"""`
		},
		{
			name: "fenced-code",
			id: "file:///tmp/fenced-code.tup",
			source: `%% js
const x = 1
%%`
		},
		{ name: "inline-link", id: "file:///tmp/inline-link.tup", source: "Read [https://example.com Example]." },
		{ name: "targeted-link", id: "file:///tmp/targeted-link.tup", source: "Open [./slides.html|blank Slides]." },
		{
			name: "frame-directive",
			id: "file:///tmp/frame.tup",
			source: `!frame ./slides.html slides
`
		},
		{
			name: "import-directive",
			id: "file:///tmp/import.tup",
			source: `!import ./other
`
		},
		{
			name: "import-same-file-twice",
			id: "file:///tmp/import-same-twice.tup",
			source: `!import ./shared
!import ./shared
`
		},
		{
			name: "import-same-filename-different-folders",
			id: "file:///tmp/import-same-name-different-folders.tup",
			source: `!import ./alpha/shared
!import ./beta/shared
`
		},
		{ name: "inline-quote", id: "file:///tmp/quote.typeup", source: '\"hello\"' },
		{
			name: "custom-extension",
			id: "file:///tmp/custom.custom",
			source: "chapter: Test",
			options: { extensions: ["custom"] }
		}
	])("transforms real parser output: $name", async ({ id, source, options }) =>
		expect(await typeup(options).transform(source, id)).toMatchSnapshot())
	it.each([
		{ name: "Error", thrown: new Error("boom"), expected: "boom" },
		{ name: "non-Error", thrown: "boom", expected: "boom" }
	])("wraps stringify $name failures", async ({ thrown, expected }) => {
		vi.spyOn(JSON, "stringify").mockImplementationOnce(() => {
			throw thrown
		})
		await expect(typeup().transform("source", "file:///tmp/input.tup")).rejects.toThrow(
			`Parser result for "file:///tmp/input.tup" is not JSON-serializable: ${expected}`
		)
	})
})
