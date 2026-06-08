# rollup-plugin

Rollup plugin to import TypeUp files and parse them into a TypeUp Document Object Model.

## Usage

```js
import { typeup } from "@typeup/rollup-plugin"

export default {
  plugins: [typeup()]
}
```

## TypeScript

To add `.tup` import typing globally, include the plugin types entry in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@typeup/rollup-plugin/types"]
  }
}
```

If you prefer a file import, create a local `global.d.ts` and add:

```ts
import "@typeup/rollup-plugin/types"
```
