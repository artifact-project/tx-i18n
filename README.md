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
						i18nTx({}), // <!--- TypeScript i18n Transformer
					],
					after: [],
				}),
			},
		}],
	},

	plugins: [
		new i18nExtractor({
			output: './locale/default.json', // <!--- Extract original phrases
		}),
	],
};
```

##### `app-entry-point.ts`

```ts
import { createLocale, setLocale, setLang } from 'tx-i18n';
import originalPhrases from './locale/default';
import translatedPhrases from './locale/en';

setLocale('default', createLocale(originalPhrases, originalPhrases));
setLocale('en', createLocale(originalPhrases, translatedPhrases));

setLang('en');
```

---

### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
