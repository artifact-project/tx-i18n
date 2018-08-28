tx-i18n
-------
Auto-translate for your application (React supported)

```sh
npm i --save-dev tx-i18n
```

---

### Usage with webpack

##### `webpack.config.js`

```js
const { i18nTx, i18nExtractor } = require('tx-i18n/webpack');

module.exports = {
	// ...
	module: {
		rules: [{
			test: /\.tsx?$/,
			loader: 'awesome-typescript-loader',
			exclude: /node_modules/,
			options: {
				getCustomTransformers: () => ({
					before: [
						i18nTx({}), // <!--- (1) TypeScript i18n Transformer
					],
					after: [],
				}),
			},
		}],
	},

	plugins: [
		new i18nExtractor({
			output: './src/locale/default.json', // <!--- (2) Extract original phrases
		}),
	],
};
```

##### `app-entry-point.ts`

```ts
import { setLang, setLocale } from 'tx-i18n';
import defaultLocale from './locale/default';
import englishLocale from './locale/en';

setLocale('default', defaultLocale);
setLocale('en', englishLocale);

setLang('en');
```

---

### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
