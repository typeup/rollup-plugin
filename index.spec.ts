import { beforeEach, describe, expect, it, vi } from "vitest"
import { binotype } from "./index"

const { parseMock } = vi.hoisted(() => ({
	parseMock: vi.fn<(siteType: string, source: string, id: string) => Promise<unknown>>()
}))

vi.mock("@binotype/site", () => ({
	binotype: {
		Parser: class {
			parse(siteType: string, source: string, id: string) {
				return parseMock(siteType, source, id)
			}
		}
	}
}))

describe("binotype", () => {
	beforeEach(() => {
		parseMock.mockReset()
	})

	it("exposes the package plugin name", () => {
		const plugin = binotype()
		expect(plugin.name).toBe("@binotype/rollup-plugin")
	})

	it("transforms matching files by parsing their text content", async () => {
		parseMock.mockResolvedValueOnce({ html: "<p>hello</p>" })
		const plugin = binotype()

		const result = await plugin.transform("hello", "/content/page.typeup")

		expect(parseMock).toHaveBeenCalledWith("site", "hello", "/content/page.typeup")
		expect(result?.code).toBe('export default {"html":"<p>hello</p>"};')
	})

	it("transforms .tup files with default extensions", async () => {
		parseMock.mockResolvedValueOnce({ html: "<p>hello</p>" })
		const plugin = binotype()

		const result = await plugin.transform("hello", "/content/page.tup")

		expect(parseMock).toHaveBeenCalledWith("site", "hello", "/content/page.tup")
		expect(result?.code).toBe('export default {"html":"<p>hello</p>"};')
	})

	it("uses relative root file name when id has no directory", async () => {
		parseMock.mockResolvedValueOnce({ text: "hello" })
		const plugin = binotype()

		const result = await plugin.transform("hello", "page.typeup")

		expect(parseMock).toHaveBeenCalledWith("site", "hello", "page.typeup")
		expect(result?.code).toBe('export default {"text":"hello"};')
	})

	it("uses page parser mode when configured", async () => {
		parseMock.mockResolvedValueOnce({ html: "<article>hello</article>" })
		const plugin = binotype({ type: "page" })

		const result = await plugin.transform("hello", "/content/page.typeup")

		expect(parseMock).toHaveBeenCalledWith("page", "hello", "/content/page.typeup")
		expect(result?.code).toBe('export default {"html":"<article>hello</article>"};')
	})

	it("does not transform files with non-matching extensions", async () => {
		const plugin = binotype()

		const result = await plugin.transform("hello", "/content/page.txt")

		expect(result).toBeNull()
		expect(parseMock).not.toHaveBeenCalled()
	})

	it("allows overriding matched extensions", async () => {
		parseMock.mockResolvedValueOnce({ text: "hello" })
		const plugin = binotype({ extensions: [".txt"] })

		const result = await plugin.transform("hello", "/content/page.txt")

		expect(result?.code).toBe('export default {"text":"hello"};')
	})

	it("matches extension when id has query/hash suffix", async () => {
		parseMock.mockResolvedValueOnce({ text: "hello" })
		const plugin = binotype()

		const result = await plugin.transform("hello", "/content/page.typeup?raw#fragment")

		expect(parseMock).toHaveBeenCalledWith("site", "hello", "/content/page.typeup")
		expect(result?.code).toBe('export default {"text":"hello"};')
	})

	it("throws a clear error when parser output is not serializable", async () => {
		parseMock.mockResolvedValueOnce({ value: 1n })
		const plugin = binotype()

		await expect(plugin.transform("hello", "/content/page.typeup")).rejects.toThrow(/not JSON-serializable/)
	})

	it("includes stringified message when serialization throws a non-Error value", async () => {
		const plugin = binotype()
		parseMock.mockResolvedValueOnce({ value: "x" })
		const stringifySpy = vi.spyOn(JSON, "stringify").mockImplementation(() => {
			throw "unexpected"
		})
		try {
			await expect(plugin.transform("hello", "/content/page.typeup")).rejects.toThrow(/JSON-serializable: unexpected/)
		} finally {
			stringifySpy.mockRestore()
		}
	})
})
