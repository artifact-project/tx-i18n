import * as ts from 'typescript';
import { R_ENTITIES, decodeEntities } from './entities';
import { normJsxElement, getJsxTagName } from './utils';
import { icu } from '../utils/icu';

type HumanTextChecker = (text: string, node: ts.Node) => boolean;

interface Config {
	verbose: (...args: any[]) => void;
	isHumanText: HumanTextChecker;
	normalizeText: (value: string) => string;
	isTranslatableJsxAttribute: (attr: ts.JsxAttribute, element: ts.JsxOpeningLikeElement) => boolean;
	overrideHumanTextChecker?: (isHumanText: HumanTextChecker) => HumanTextChecker;
	textFnName: string;
	jsxFnName: string;
	packageName: string
	fileName: string;
	include: string[];
	exclude: string[];
	pharsesStore?: ContextedPhrases;
	compilerOptions: ts.CompilerOptions;
	imports: {
		[name:string]: ts.ImportDeclaration;
	};
	sourceFile: ts.SourceFile;
}

const R_IS_TAG = /^[a-z0-9:]+$/;
const stringify = JSON.stringify;
const SINGLE_QUOTE_CODE = `'`.charCodeAt(0);

function log(obj: object | string | number | boolean, ind = '', max = 3) {
	if (obj == null || /number|string|boolean/.test(typeof obj)) {
		console.log(obj);
		return;
	}

	const copy = {...Object(obj)};
	let lines = [];
	delete copy['parent'];

	for (let key in copy) {
		lines.push(
			`${ind}${key}: ` + (
			copy[key] === null ? 'null' :
				typeof copy[key] === 'object'
					? max > 0 ? '\n' + log(copy[key], ind + '  ', max - 1) : '{ ... }'
					: copy[key]
		));
	}

	if (ind === '') {
		console.log(lines.join('\n'));
	}

	return lines.join('\n');
}

export type Phrase = {
	value: string;
	file: string;
	ctx: string;
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

export type ContextedPhrases = {
	[context: string]: Phrase[];
}

export function contextedPhrasesForEach(
	phrases: ContextedPhrases,
	iterator: (phrase: Phrase, ctx: string) => void,
) {
	Object.keys(phrases).forEach((ctx) => {
		phrases[ctx].forEach((phrase) => {
			iterator(phrase, ctx);
		});
	})
}

export function contextedPhrasesFilter(
	phrases: ContextedPhrases,
	filter: (phrase: Phrase, ctx: string) => boolean,
) {
	const filteredPhrases = {} as ContextedPhrases;

	contextedPhrasesForEach(phrases, (phrase, ctx) => {
		if (filter(phrase, ctx)) {
			if (!filteredPhrases.hasOwnProperty(ctx)) {
				filteredPhrases[ctx] = [];
			}

			filteredPhrases[ctx].push(phrase);
		}
	});

	return filteredPhrases;
}

let phrasesContext: string[];
let phrasesWithContext: ContextedPhrases = {};
let useNormalizeText: boolean = true; // @todo: пока не работает

function normalizeText({normalizeText}: Config, value: string): string {
	return useNormalizeText ? normalizeText(value) : value;
}

function savePhrase(value: string, node: ts.Node, {sourceFile}: Config) {
	const context = phrasesContext[0];

	if (!phrasesWithContext.hasOwnProperty(context)) {
		phrasesWithContext[context] = [];
	}

	phrasesWithContext[context].push({
		ctx: context,
		value,
		file: sourceFile.fileName,
		loc: {
			start: sourceFile.getLineAndCharacterOfPosition(node.getStart()),
			end: sourceFile.getLineAndCharacterOfPosition(node.getEnd()),
		},
	});
}

export function resetPhrases() {
	Object.keys(phrasesWithContext).forEach(key => {
		delete phrasesWithContext[key];
	});
}

export function getPhrases() {
	return phrasesWithContext;
}

function createImport(name, path) {
	return ts.createImportDeclaration(
		undefined,
		undefined,
		ts.createImportClause(ts.createIdentifier(name), undefined),
		ts.createLiteral(path)
	);
}

function addImport(imports: Config['imports'], name: string, path: string) {
	// imports[name] = createImport(name, path);
	// TypeError: Cannot set property text of #<IdentifierObject> which has only a getter

	if (!imports.hasOwnProperty(name)) {
		Object.defineProperty(imports, name, {
			enumerable: true,
			value: createImport(name, path),
		});
	}

	return imports[name];
}

function useNativeImport(module: ts.ModuleKind) {
	return module === ts.ModuleKind.ESNext || module === ts.ModuleKind.ES2015;
}

function i18nId(cfg: Config, type: 'text' | 'jsx') {
	const fnName = type === 'jsx' ? cfg.jsxFnName : cfg.textFnName;
	const pkgFile = `${cfg.packageName}/${type}`;
	const importDecl = addImport(cfg.imports, fnName, pkgFile);
	const useNative = useNativeImport(cfg.compilerOptions.module);

	let id: ts.Expression = useNative
		? ts.createIdentifier(fnName)
		: ts.getGeneratedNameForNode(importDecl)
	;

	return useNative ? id : ts.createPropertyAccess(id, 'default');
}

function i18nWrap(cfg: Config, type: 'text' | 'jsx', args: ts.Expression[]) {
	if (phrasesContext.length > 1) {
		if (args.length === 1) {
			args.push(ts.createArrayLiteral());
		}

		args.push(createLiteral(phrasesContext[0]));
	}

	return ts.createCall(i18nId(cfg, type), [], args);
}

function visited<T extends ts.Node>(node: T): T {
	node['__visited__'] = true;
	return node;
}

function isVisited(node: ts.Node) {
	return node['__visited__'] !== void 0
}

function createLiteral(val: string) {
	const node = ts.createIdentifier(stringify(val));
	return visited(node);
}

function hasJsxTextChildren(node: ts.JsxElement | ts.JsxFragment, cfg: Config) {
	return node.children.some(child => {
		if (ts.isJsxText(child)) {
			return cfg.isHumanText(child.getText(), child)
		} else {
			return false;
		}
	});
}

function wrapStringLiteral(node: ts.Node | undefined, cfg: Config, decode?: boolean) {
	if (!node || !ts.isStringLiteralLike(node)) {
		return visited(node);
	}

	let nodeText = node.getText();
	let isSingleQuote = nodeText.charCodeAt(0) === SINGLE_QUOTE_CODE;
	if (isSingleQuote) {
		nodeText = stringify(node.text);
	}

	let quotedText = icu.quote(nodeText);
	let normText = normalizeText(cfg, quotedText);
	
	// console.log([nodeText, quotedText, node.text])

	if (!cfg.isHumanText(normText, node)) {
		return visited(node);
	}

	savePhrase(normText.slice(1, -1), node, cfg);

	if (decode) {
		normText = decodeEntities(normText);
	}

	return i18nWrap(cfg, 'text', [ts.createIdentifier(normText)]);
}

const rICUFn = /^(plural|select)/i;

function parseICU(node: ts.Expression, idx: number) {
	if (node.end < 0 || node.pos < 0) {
		return null;
	}

	let len:number = 0;

	try {
		len = node.getChildCount();
	} catch {}

	if (len === 4) {
		const children = node.getChildren();
		const fn = children[0];
		const parsedName = fn.getText().match(rICUFn);

		if (0
			|| (parsedName === null) // имя не подходит под маску
			|| (children[1].kind !== ts.SyntaxKind.OpenParenToken) // проверяем "("
			|| (children[3].kind !== ts.SyntaxKind.CloseParenToken) // и ")"
		) {
			return null;
		}

		const args = children[2].getChildren();

		if (0
			|| args.length !== 3
			|| !ts.isObjectLiteralExpression(args[2])
		) {
			return null;
		}

		const val = args[0];
		const parts = [] as string[];

		(args[2] as ts.ObjectLiteralExpression).properties.forEach((node) => {
			if (ts.isPropertyAssignment(node)) {
				parts.push(`${node.name.getText()} {${node.initializer.getText().slice(1, -1)}}`);
			}
		});

		const expr = ts.createObjectLiteral([
			ts.createPropertyAssignment('$', fn as ts.Expression),
			ts.createPropertyAssignment('_', val as ts.Expression),
		]);

		return {
			value: `{v${idx}, ${parsedName[0].toLowerCase()}, ${parts.join(' ')}}`,
			expr,
		};
	}

	return null;
}

function wrapTemplateExpression(node: ts.TemplateExpression, context, cfg: Config) {
	const args = [];
	let isPlainText = node.templateSpans.length === 1;
	let phrase = '';

	node.templateSpans.forEach((span, idx) => {
		const xicu = parseICU(span.expression, idx + 1)

		if (xicu !== null) {
			isPlainText = false;
			phrase += `${xicu.value}${span.literal.text}`;
			args.push(xicu.expr);
		} else if (ts.isStringLiteralLike(span.expression)) {
			phrase += `${span.expression.text}${span.literal.text}`;
		} else {
			isPlainText = false;
			phrase += `{v${(idx + 1)}}${icu.quote(span.literal.text)}`; // todo: var name
			args.push(visitNodeAndChildren(span.expression, context, cfg));
		}
	});

	// Вот теперь, добавляем `head`
	phrase = `${isPlainText ? node.head.text : icu.quote(node.head.text)}${phrase}`;

	if (!cfg.isHumanText(phrase, node)) {
		return visited(node);
	}

	phrase = normalizeText(cfg, phrase);
	savePhrase(phrase, node, cfg);

	if (isPlainText) {
		return i18nWrap(cfg, 'text', [createLiteral(phrase)]);
	}

	return i18nWrap(cfg, 'text', [
		createLiteral(phrase),
		ts.createArrayLiteral(args),
	]);
}

// type Scope = {
// 	type: 'root' | 'literal' | 'template' | 'jsx' | 'plural';
// 	parent: Scope;
// }

// let activeScope: Scope = {
// 	type: 'root',
// 	parent: null,
// }

// function scoped<R extends any>(
// 	type: Scope['type'],
// 	executer: (scope: Scope) => R,
// ): R {
// 	const parent = activeScope;
// 	activeScope = {
// 		type,
// 		parent,
// 	};

// 	const result = executer(activeScope);

// 	activeScope = parent;

// 	return result
// }
// type VisitState = {
// 	readonly jsx: boolean;
// 	icu: ReturnType<typeof parseICU>[];
// }

function visitNode(
	node: ts.Node,
	context: ts.TransformationContext,
	cfg: Config,
): ts.Node {
	const {
		isHumanText,
	} = cfg;

	if (!node || isVisited(node)) {
		return node;
	}

	if (1
		&& (!node.parent || !ts.isImportDeclaration(node.parent))
		&& (0
			|| ts.isStringLiteral(node)
			|| ts.isNoSubstitutionTemplateLiteral(node)
		)
		&& isHumanText(node.getFullText(), node)
	) {
		const {parent} = node;

		if (parent) {
			if (0
				|| ts.isPropertyAssignment(parent) && parent.name === node
				|| ts.isElementAccessExpression(parent)
			) {
				return node;
			}

			const attr = ts.isJsxAttribute(parent)
				? parent
				: parent.parent && ts.isJsxAttribute(parent.parent) && parent.parent
			;

			// JSX Attribute
			if (attr) {
				if (0
					|| !isTagName(attr.parent.parent.tagName.getText())
					|| cfg.isTranslatableJsxAttribute(attr, attr.parent.parent)
				) {
					const newNode = wrapStringLiteral(node, cfg, true);
					return newNode === node ? node : ts.createJsxExpression(undefined, newNode as ts.Expression);
				}

				return node;
			}
		}

		return wrapStringLiteral(node, cfg);
	} else if (ts.isTemplateExpression(node)) {
		// Literal template
		const {parent} = node;

		if (parent && (ts.isComputedPropertyName(parent) || ts.isElementAccessExpression(parent))) {
			return node;
		}

		if (
			node.parent
			&& node.parent.parent
			&& ts.isJsxAttribute(node.parent.parent)
			&& (
				!cfg.isTranslatableJsxAttribute(node.parent.parent, node.parent.parent.parent.parent)
				&& isTagName(node.parent.parent.parent.parent.tagName.getText())
			)
		) {
			return node;
		}

		return wrapTemplateExpression(node, context, cfg);
	} else if ((ts.isJsxElement(node) || ts.isJsxFragment(node)) && hasJsxTextChildren(node, cfg)) {
		// JSX
		const args = [];
		let simple = true;
		let gpart = 0;
		let phrase = '';
		let hasText = false;

		node.children.forEach(function processing(child) {
			if (ts.isJsxElement(child)) {
				let tagName = `${getJsxTagName(child)}${++gpart}`;

				simple = false;
				phrase += `<${tagName}>`;
				args.push(jsxTagToObject(child, context, cfg));
				child.children.forEach(processing)
				phrase += `</${tagName}>`;
			} else if (ts.isJsxText(child)) {
				hasText = true;
				phrase += child.getFullText();
			} else if (ts.isJsxExpression(child)) {
				if (child.expression) {
					++gpart
					simple = false;

					if (ts.isCallExpression(child.expression)) {
						const icu = parseICU(child.expression, gpart);

						if (icu !== null) {
							phrase += icu.value;
							args.push(icu.expr);
							return;
						}
					}

					phrase += `{v${gpart}}`; // todo: var name
					args.push(visitNode(child.expression, context, cfg));
				}
			} else if (ts.isJsxSelfClosingElement(child)) {
				simple = false;
				phrase += `<${getJsxTagName(child)}${++gpart}/>`;
				args.push(jsxTagToObject(child, context, cfg));
			} else {
				log(child);
				throw new Error('Not supproted');
			}
		}, args);

		phrase = normalizeText(cfg, phrase.trim());

		if (!hasText || !isHumanText(phrase, node)) {
			return node;
		}

		savePhrase(phrase, node, cfg);

		if (simple && !R_ENTITIES.test(phrase)) {
			if (ts.isJsxFragment(node)) {
				return ts.updateJsxFragment(
					node,
					node.openingFragment,
					[ts.createJsxExpression(undefined, i18nWrap(
						cfg,
						'text',
						[].concat(
							createLiteral(phrase),
							args.length ? ts.createArrayLiteral(args) : [],
						),
					))],
					node.closingFragment,
				);
			} else {
				return ts.updateJsxElement(
					node,
					node.openingElement,
					[ts.createJsxExpression(undefined, i18nWrap(
						cfg,
						'text',
						[].concat(
							createLiteral(phrase),
							args.length ? ts.createArrayLiteral(args) : [],
						),
					))],
					node.closingElement,
				);
			}
		}

		const callExp = i18nWrap(
			cfg,
			'jsx',
			[
				createLiteral(phrase),
				ts.createArrayLiteral([
					(ts.isJsxFragment(node)
						? ts.createIdentifier('{ type: React.Fragment }')
						: jsxTagToObject(node, context, cfg)
					),
					...args,
				]),
			],
		);

		if (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent)) {
			return ts.createJsxExpression(undefined, callExp);
		}

		return callExp;
	} else if (ts.isCallExpression(node)) {
		const icu = parseICU(node, 1);

		if (icu !== null) {
			savePhrase(icu.value, node, cfg);
			return i18nWrap(cfg, 'text', [
				createLiteral(icu.value),
				ts.createArrayLiteral([icu.expr]),
			]);
		}
	}

	return node;
}

type InlineConfig = {
	context: string;
	normalize: string;
	isJSXExpr: boolean;
};

function parseInlineConfig(node: ts.Node): InlineConfig {
	let expr = '';

	if (ts.isJsxExpression(node) && !node.expression) {
		try {
			expr = node.getText();
		} catch (err) {}
	}

	if (node.hasOwnProperty('jsDoc') && node['jsDoc'].length) {
		expr = node['jsDoc'][0].getText();
	}

	const rule = expr ? expr.match(/@tx-i18n\s+([a-z]+(?:\s*:\s*[\w\d]+)?(?:,\s*)?)+/) : null;

	if (rule) {
		return rule[0]
			.split('@tx-i18n')[1]
			.trim()
			.split(/\s*,\s*/g).reduce((cfg, token) => {
				let [key, val] = token.split(/\s*:\s*/);
				cfg[key] = val == null ? 'true' : val;
				return cfg;
			}, {
				isJSXExpr: ts.isJsxExpression(node),
			} as InlineConfig)
		;
	}
}

function visitNodeAndChildren(node: ts.Node, context, cfg: Config, jsxInlineConfig: InlineConfig[] = []) {
	if (!node) {
		return node;
	}

	return ts.visitEachChild(
		visitNode(node, context, cfg),
		(childNode) => {
			if (!childNode) {
				return childNode;
			}

			let inlineCfg = parseInlineConfig(childNode);

			if (!inlineCfg) {
				if (ts.isJsxElement(childNode)) {
					inlineCfg = jsxInlineConfig.pop();
				}
			} else if (inlineCfg.isJSXExpr) {
				jsxInlineConfig.push(inlineCfg);
				inlineCfg = null;
			}

			if (inlineCfg) {
				useNormalizeText = inlineCfg.normalize !== 'false';
				inlineCfg.context && phrasesContext.unshift(inlineCfg.context);
			} else {
				useNormalizeText = true;
			}

			const result = visitNodeAndChildren(childNode, context, cfg);

			if (inlineCfg) {
				inlineCfg.context && phrasesContext.shift();
			}

			return result;
		},
		context,
	);
}

function isTagName(name: string) {
	return R_IS_TAG.test(name);
}

function jsxTagToObject(
	node: ts.JsxElement | ts.JsxSelfClosingElement,
	context: object,
	cfg: Config,
) {
	const element = normJsxElement(node);
	const {attributes} = element;

	let type = element.tagName.getFullText();
	let props: ts.ObjectLiteralElementLike[] = [];

	attributes.properties.forEach(prop => {
		if (ts.isJsxAttribute(prop)) {
			const {initializer} = prop;
			let name = prop.name.getText();
			let value: ts.Expression;

			if (initializer) {
				if (cfg.isTranslatableJsxAttribute(prop, element) && cfg.isHumanText(prop.getText(), node)) {
					if (ts.isJsxExpression(initializer)) {
						if (ts.isTemplateExpression(initializer.expression)) {
							value = wrapTemplateExpression(initializer.expression, context, cfg);
						} else {
							value = ts.createIdentifier(initializer.getText().slice(1, -1));
						}
					} else {
						value = wrapStringLiteral(initializer, cfg) as ts.Expression;
					}
				} else {
					value = ts.isJsxExpression(initializer) ? initializer.expression : initializer;
				}
			} else {
				value = ts.createIdentifier('true');
			}

			props.push(ts.createPropertyAssignment(
				stringifyObjectKey(name),
				value,
			));
		} else if (ts.isJsxSpreadAttribute(prop)) {
			// log();
			props.push(ts.createSpreadAssignment(prop.expression));
		}
	});


	return ts.createObjectLiteral([
		ts.createPropertyAssignment(
			'type',
			isTagName(type) ? ts.createIdentifier(`"${type}"`) : element.tagName,
		),
		ts.createPropertyAssignment(
			'props',
			props.length ? ts.createObjectLiteral(props) : ts.createNull(),
		),
	]);
}

function checkPatterFile(this: Config, mask: string) {
	return this.fileName.match(mask) !== null;
}

const R_IS_SIMPLE_OBJ_KEY = /^[a-z\d_]+$/i;
function stringifyObjectKey(name: string) {
	return R_IS_SIMPLE_OBJ_KEY.test(name) ? name : JSON.stringify(name)
}

export type TXConfig = Partial<Pick<Config,
	| 'textFnName'
	| 'jsxFnName'
	| 'packageName'
	| 'include'
	| 'exclude'
	| 'isHumanText'
	| 'isTranslatableJsxAttribute'
	| 'overrideHumanTextChecker'
	| 'normalizeText'
	| 'pharsesStore'
	| 'verbose'
>>

const R_NORM_TEXT = /(>?)[\r\n]+[ \t]*(<?)/g;
const NORM_TEXT_FN = (token: string, gt: string, lt: string, idx: number, input: string) => {
    return gt + ((lt || gt) || (idx + token.length == input.length) || idx == 0 ? '' : ' ') + lt;
};

export default function transformerFactory(config: TXConfig) {
	if (config.pharsesStore) {
		phrasesWithContext = config.pharsesStore;
	}

	const verbose = config.verbose || (() => {});

	return function transformer(context: ts.TransformationContext) {
		verbose('transformer inited',);

		return function visitor(file: ts.SourceFile) {
			verbose('visitor inited:', file.fileName);

			const cfg: Config = {
				verbose,
				textFnName: '__',
				jsxFnName: '__jsx',
				packageName: 'tx-i18n',
				fileName: file.fileName,
				exclude: ['/tx-i18n/', '/node_modules/'],
				include: null,
				imports: {},
				compilerOptions: context.getCompilerOptions(),
				normalizeText: (value: string) => value.replace(R_NORM_TEXT, NORM_TEXT_FN),
				isHumanText: (value: string) => /[\wа-яё]/i.test(
					value.trim()
						.replace(/\{v\d+\}/g, '')
						.replace(/\d+([^\s]+)?/g, '')
						.trim()
				),
				isTranslatableJsxAttribute: (attr: ts.JsxAttribute) => /^(title|alt|placeholder|value)$/.test(attr.name.getText()),
				sourceFile: file,
				...config,
			};

			phrasesContext = ['default'];

			if (cfg.overrideHumanTextChecker) {
				cfg.isHumanText = cfg.overrideHumanTextChecker(cfg.isHumanText);
			}

			const forceInclude = cfg.include ? cfg.include.some(checkPatterFile, cfg) : false;

			if (cfg.exclude.some(checkPatterFile, cfg)) {
				verbose(`File excluded:`, file.fileName, cfg.exclude);
				if (forceInclude) {
					verbose(`But included by`, cfg.exclude);
				} else {
					return file;
				}
			}

			if (cfg.include && !forceInclude) {
				verbose(`File not included:`, file.fileName, cfg.include);
				return file;
			}

			try {
				const result = visitNodeAndChildren(file, context, cfg);

				try {
					return ts.updateSourceFileNode(
						result,
						Object.keys(cfg.imports)
							.map(name => cfg.imports[name])
							.concat(result.statements),
					);
				} catch (err) {
					console.error([
						`\x1b[31m\n[tx-i18n] [update] ${cfg.fileName}`,
						`---`,
						`${err.toString()}\n\x1b[0m`
					].join('\n'));
					return file;
				}
			} catch (err) {
				console.error([
					`\x1b[31m\n[tx-i18n] [visit] ${cfg.fileName}`,
					`---`,
					`${err.toString()}\n\x1b[0m`,
				].join('\n'));
				return file;
			}
		}
	}
}
