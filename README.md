tx-i18n
-------
Auto-translate for your application (TSX/React supported)

```sh
npm i --save-dev tx-i18n
```

---

### Feature

- No additional markup (Just [compare](./COMPARE.md) with [react-intl](https://github.com/yahoo/react-intl) or [react-i18next](https://github.com/i18next/react-i18next))
- Fastest (see [benchmarks](./__bench__/))
- [Context](#context)
- [Pluralization](#pluralization) by [CLDR](http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html#en) (todo)
- Support
  - Litteral strings
  - Template strings
  - TSX/React: Text, Expression, Attributes, Fragment & Tags (any complexity)
  - **Not supproted**
    - Object keys

---

### Usage with "pure" TypeScript

[ttypescript](https://github.com/cevek/ttypescript) — it's not a typo 👐🏻

```sh
npm i --save-dev ttypescript
```

##### Add transformer-plugin to `tsconfig.json` in `compilerOptions` section

```ts
{
  "compilerOptions": {
    "plugins": [{
	  "transform": "tx-i18n/plugin",
	  "humanTextCheckRegExp": "а-яё",
      "output": "./src/locale/default.ts"
    }]
  },
}
```


##### Edit `package.json` and use `ttsc` (yep, double `t`) instead of `tsc`

```json
{
  "name": "your-package",
  "scripts": {
    "build": "ttsc"
  }
}
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
			output: './src/locale/__default__.ts', // <!--- (2) Extract original phrases as ES Module
		}),
	],
};
```

##### `app-entry-point.ts`

```ts
import { setLang, setLocale } from 'tx-i18n';
import locale from './locale/en';

setLocale('en', locale);
setLang('en');
```

##### `./src/locale/__default__.ts`

```ts
export default {
	'default': {
		'Hi, <#1>!': 'Hi, <#1>!',
		'Click <1>here</1> for help': 'Click <1>here</1> for help',
	},
};
```

---

<a name="context"></a>

### Context

```jsx
const dict = {
	firstName: 'Имя',
	lastName: 'Фамилия',
};

/** @tx-i18n context: personal */
const personalDict = {
	firstName: 'Имя',
	lastName: 'Фамилия',
};

const Dialog = () => (
	<div>
		{/** @tx-i18n context: personal */}
		<form>
			<h1>Ваши данные</h1>
			<fieldset>...</fieldset>
		</form>
	</div>
);
```

##### `./src/locale/__default__.ts`

```ts
export default {
	'default': {
		'Имя': 'Имя',
		'Фамилия': 'Фамилия',
	},
	'personal': {
		'Имя': 'Имя',
		'Фамилия': 'Фамилия',
		'Ваши данные': 'Ваши данные',
	},
};
```

---

<a name="pluralization">

### Pluralization


```jsx
import { plural } from 'tx-i18n';

const Hello = ({name, unreadCount}) => (
	<div>
		Hello <b>{name}</b>, you have <a href="#unread">{unreadCount} {plural('messages', unreadCount)}</a>.
	</div>
);
```

##### `./src/locale/__plural__.ts`

```ts
import { PluralRules, PluralKeys } from 'tx-i18n/plural';

export default {
	default: {
		messages: true,
	},
};

export type PluralLocale<PR extends PluralRules, PK extends PluralKeys> = {
	[CONTEXT in keyof PK]: {
		[KEY in keyof PK[CONTEXT]]: {
			[TYPE in keyof PR]: {
				[CATEGORY in keyof PR[TYPE]]: string;
			};
		};
	};
};
```

##### `./src/locale/ru_RU.plural.ts`

```ts
import { setPlural } from 'tx-i18n';
import ruLules from 'tx-i18n/plural/rules/ru';
import pluralKeys from './__plural__';

setPlural('ru_RU', ruLules, pluralKeys, {
	default: {
		messages: {
			one: 'сообщение',
			few: 'сообщения',
			many: 'сообщений',
			other: 'сообщения',
		},
	},
});
```

---

### API

##### getLang(): string
Get a current lang.

---

##### setLang(lang)
Change a current lang.

- **lang**: `string`

---

##### setLocale(lang, locale)
Set a locale for a lang.

- **lang**: `string`
- **locale**: `Locale`

---

##### addLangObserver(listener): unobserve
Add an observer on a lang changes.

- **listener**: `(lang, prevLang) => void`

---

##### getTranslate(phrase[, lang]): string
Get a translate for a phrase.

- **phrase**: `string`
- **lang**: `string`

---

### Internal API

#### i18nTx

Is a magic typescript transformer ;]

- **fnName**: `string` — the name of the function that will be used to wrap strings. (optional, default: `__`)
- **packageName**: `string` — the name of the package from which will be exported as default the function with the name `fnName`. (optional, default: `tx-i18n`)
- **include**: `Array<string|regexp>` — an array of files or paths that need for a transform. (optional)
- **exclude**: `Array<string|regexp>` — an array of files or paths that need to exclude for a transform. (optional)
- **pharsesStore**: `ContextedPharses` — a reference to a variable which will be used to collect phrases (optional)
- **normalizeText**: `(text: string) => string` — (optional)
- **isHummanText**: `(text: string, node: ts.Node) => boolean` — (optional)
- **isTranslatableJsxAttribute**: `(attr: ts.JsxAttribute, elem: ts.JsxElement) => boolean` — (optional)
- **overrideHumanTextChecker**: `(isHummanText: HumanTextChecker) => HumanTextChecker` — (optional)

---

#### i18nExtractor

Is a webpack plugin for save all phrases to translate

- **output**: `string | (phases: ContextedPhrases) => Array<{file: string; phases: ContextedPhrases}>` — the filename or function that returns the array for separation `phrases` by files.
  - `.json` — save as `json`
  - If you use `.ts` or `.js`, file will be saved as ES Module.
- **stringify**: `(locale: ContextedLocale) => string` — convertor to json before save (optional)
- **indent**: `string` — `  ` (optional)

```ts
type ContextedPhrases = {
	[context: string]: Pharse[];
}

type Pharse = {
	value: string;
	file: string;
	loc: {
		start: {
			line: number;
			character: number;
		};
		end: {
			line: number;
			character: number;
		};
	};
}

type ContextedLocale = {
	[context: string]: Locale;
}

type Locale = {
	[pharse: string]: string;
}
```

---

### How it works

Using the [Compiler API](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API), `i18Tx` traversing the AST-tree and wrap the text nodes a special function + add the import of this function, it looks like this:

#### Simple text

```ts
// Original
const text = 'Hello world';

// Transformed (after bundle build)
import __ from 'tx-i18n';
const text = __('Hello world');
```

#### Literal template

```ts
// Original
const text = `Hi, ${username}!`;

// Transformed (after bundle build)
import __ from 'tx-i18n';
const text = __('Hi, <#1>!', [username]);
```

#### TSX / React

```jsx
// Original
const Fragment = () => (
	<div title="This is fragment" data-name="frag">
		<h1>Fragment of HTML</h1>
		<div>
			Click <a href="#help" title="How to use tx-i18n">here</a> for detail.
		</div>
	</div>
);

// Transformed (after bundle build)
import __ from 'tx-i18n';
const Fragment = () => (
	<div title={__('This is fragment')} data-name="frag">
		<h1>{__('Fragment of HTML')}</h1>
		{__.jsx('Click <1>here</1> for detail.', [
			{type: 'div', props: {}},
			{
				type: 'a',
				props: {
					href: '#help'
					title: __('How to use tx-i18n'),
				},
			},
		])}
	</div>
);
```

---

### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)


---

### Support

#### v0.5

- webpack: 4.29
- typescript: 3.0
- awesome-typescript-loader: 5.2