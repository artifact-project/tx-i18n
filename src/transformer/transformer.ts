import * as ts from 'typescript';
import { R_ENTITIES, decodeEntities } from './entities';

type HumanTextChecker = (text: string, node: ts.Node) => boolean;

interface Config {
	isHumanText: HumanTextChecker;
	normalizeText: (value: string) => string;
	isTranslatableJsxAttribute: (attr: ts.JsxAttribute, element: ts.JsxOpeningLikeElement) => boolean;
	overrideHumanTextChecker?: (isHumanText: HumanTextChecker) => HumanTextChecker;
	fnName: string;
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

function log(obj: object, ind = '', max = 3) {
	if (obj == null || /number|string|boolean/.test(typeof obj)) {
		console.log(obj);
		return;
	}

	const copy = {...obj};
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

export type Pharse = {
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
	[context: string]: Pharse[];
}

export function contextedPhrasesForEach(
	phrases: ContextedPhrases,
	iterator: (phrase: Pharse, ctx: string) => void,
) {
	Object.keys(phrases).forEach((ctx) => {
		phrases[ctx].forEach((phrase) => {
			iterator(phrase, ctx);
		});
	})
}

export function contextedPhrasesFilter(
	phrases: ContextedPhrases,
	filter: (phrase: Pharse, ctx: string) => boolean,
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

function addImport(imports: Config['imports'], name, path) {
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

function i18nId(cfg: Config, prop?: string) {
	const importDecl = addImport(cfg.imports, cfg.fnName, cfg.packageName);
	let id: ts.Expression = useNativeImport(cfg.compilerOptions.module)
		? ts.createIdentifier(cfg.fnName)
		: ts.getGeneratedNameForNode(importDecl);

	if (!useNativeImport(cfg.compilerOptions.module)) {
		id = ts.createPropertyAccess(id, 'default');
	}

	return prop ? ts.createPropertyAccess(id, prop) : id;
}

function i18nWrap(cfg: Config, prop: string, args: ts.Expression[]) {
	if (phrasesContext.length > 1) {
		if (args.length === 1) {
			args.push(ts.createArrayLiteral());
		}

		args.push(createLiteral(phrasesContext[0]));
	}

	return ts.createCall(i18nId(cfg, prop), [], args);
}

function visited<T extends ts.Node>(node: T): T {
	node['__visited__'] = true;
	return node;
}

function createLiteral(val: string) {
	const node = ts.createIdentifier(JSON.stringify(val));
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

function wrapStringLiteral(node: ts.StringLiteralLike, cfg: Config, decode?: boolean) {
	let text = normalizeText(cfg, node.getText());

	if (!cfg.isHumanText(text, node)) {
		return visited(node);
	}

	savePhrase(text.slice(1, -1), node, cfg);

	if (decode) {
		text = decodeEntities(text);
	}

	return i18nWrap(cfg, null, [ts.createIdentifier(text)]);
}

function wrapTemplateExpression(node: ts.TemplateExpression, context, cfg: Config) {
	const args = [];
	let phrase = node.head.text;

	node.templateSpans.forEach((span, idx) => {
		phrase += `<#${(idx + 1)}>${span.literal.text}`;
		args.push(visitNodeAndChildren(span.expression, context, cfg));
	});

	if (!cfg.isHumanText(phrase, node)) {
		return visited(node);
	}

	phrase = normalizeText(cfg, phrase);
	savePhrase(phrase, node, cfg);

	return i18nWrap(cfg, null, [
		createLiteral(phrase),
		ts.createArrayLiteral(args),
	]);
}

function visitNode(node: ts.Node, context, cfg: Config): ts.Node {
	const {
		isHumanText,
	} = cfg;

	if (node['__visited__']) {
		return node;
	}

	if (
		(!node.parent || !ts.isImportDeclaration(node.parent))
		&& (
			ts.isStringLiteral(node)
			|| ts.isNoSubstitutionTemplateLiteral(node)
		)
		&& isHumanText(node.getFullText(), node)
	) {
		const {parent} = node;

		if (parent) {
			if (
				ts.isPropertyAssignment(parent) && parent.name === node
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
				if (
					!isTagName(attr.parent.parent.tagName.getText())
					|| cfg.isTranslatableJsxAttribute(attr, attr.parent.parent)
				) {
					const newNode = wrapStringLiteral(node, cfg, true);
					return newNode === node ? node : ts.createJsxExpression(undefined, newNode);
				}
				return node;
			}
		}

		return wrapStringLiteral(node, cfg);
	} else if (ts.isTemplateExpression(node)) {
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
		const args = [];
		let simple = true;
		let gpart = 0;
		let phrase = '';
		let hasText = false;

		node.children.forEach(function processing(child) {
			if (ts.isJsxElement(child)) {
				let part = ++gpart;

				simple = false;
				phrase += `<${part}>`;
				args.push(jsxTagToObject(child, context, cfg));
				child.children.forEach(processing)
				phrase += `</${part}>`;
			} else if (ts.isJsxText(child)) {
				hasText = true;
				phrase += child.getFullText().replace(/[\n\t]/g, '');
			} else if (ts.isJsxExpression(child)) {
				if (child.expression) {
					simple = false;
					phrase += `<#${++gpart}>`;
					args.push(visitNode(child.expression, context, cfg));
				}
			} else if (ts.isJsxSelfClosingElement(child)) {
				simple = false;
				phrase += `<${++gpart}/>`;
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
						null,
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
						null,
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

		if (ts.isJsxElement(node.parent)) {
			return ts.createJsxExpression(undefined, callExp);
		}

		return callExp;
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
	return ts.visitEachChild(
		visitNode(node, context, cfg),
		(childNode) => {
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
	const element = ts.isJsxElement(node) ? node.openingElement : node;
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
						value = wrapStringLiteral(initializer, cfg);
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
	'fnName'
	| 'packageName'
	| 'include'
	| 'exclude'
	| 'isHumanText'
	| 'isTranslatableJsxAttribute'
	| 'overrideHumanTextChecker'
	| 'normalizeText'
	| 'pharsesStore'
>>

export default function transformerFactory(config: TXConfig) {
	if (config.pharsesStore) {
		phrasesWithContext = config.pharsesStore;
	}

	return function transformer(context: ts.TransformationContext) {
		return function visitor(file: ts.SourceFile) {
			const cfg: Config = {
				fnName: '__',
				packageName: 'tx-i18n',
				fileName: file.fileName,
				exclude: ['/tx-i18n/', '/node_modules/'],
				include: null,
				imports: {},
				compilerOptions: context.getCompilerOptions(),
				normalizeText: (value: string) => value.replace(/\s+/g, ' '),
				isHumanText: (value: string) => /[\wа-яё]/i.test(
					value.trim()
						.replace(/<\d+\/?>/g, '')
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

			if (cfg.exclude.some(checkPatterFile, cfg)) {
				return file;
			}

			if (cfg.include && !cfg.include.some(checkPatterFile, cfg)) {
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
					console.error(`\x1b[31m\n[tx-i18n] [update] ${cfg.fileName}\n---\n${err.toString()}\n\x1b[0m`);
				return file;
				}
			} catch (err) {
				console.error(`\x1b[31m\n[tx-i18n] [visit] ${cfg.fileName}\n---\n${err.toString()}\n\x1b[0m`);
				return file;
			}
		}
	}
}
