import * as ts from 'typescript';

type HumanTextChecker = (text: string, node: ts.Node) => boolean;

interface Config {
	isHumanText: HumanTextChecker;
	isTranslatableJsxAttribute: (attr: ts.JsxAttribute, element: ts.JsxOpeningLikeElement) => boolean;
	overrideHumanTextChecker?: (isHumanText: HumanTextChecker) => HumanTextChecker;
	fnName: string;
	packageName: string
	fileName: string;
	include: string[];
	exclude: string[];
	compilerOptions: ts.CompilerOptions;
	imports: {
		[name:string]: ts.ImportDeclaration;
	};
}

function log(obj) {
	if (obj == null || /number|string|boolean/.test(typeof obj)) {
		console.log(obj);
		return;
	}

	const copy = {...obj};
	delete copy.parent;
	console.log(copy);
}

const phrases: string[] = [];

function savePhrase(value: string) {
	if (phrases.indexOf(value) === -1) {
		phrases.push(value);
	}

	return value;
}

export function resetPhrases() {
	phrases.length = 0;
}

export function getPhrases() {
	return phrases.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
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

function visited<T extends ts.Node>(node: T): T {
	node['__visited__'] = true;
	return node;
}

function createLiteral(val: string) {
	const node = ts.createIdentifier(JSON.stringify(val));
	return visited(node);
}

function hasJsxTextChildren(node: ts.JsxElement, cfg: Config) {
	return node.children.some(child => ts.isJsxText(child) && cfg.isHumanText(child.getText(), child));
}

function wrapStringLiteral(node: ts.StringLiteralLike, cfg: Config) {
	const text = node.getText();

	if (!cfg.isHumanText(text, node)) {
		return visited(node);
	}

	savePhrase(text.slice(1, -1));

	return ts.createCall(i18nId(cfg), [], [
		ts.createIdentifier(text),
	])
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

	savePhrase(phrase);

	return ts.createCall(i18nId(cfg), [], [
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

			if (attr) {
				if (
					!isTagName(attr.parent.parent.tagName.getText())
					|| cfg.isTranslatableJsxAttribute(attr, attr.parent.parent)
				) {
					const newNode = wrapStringLiteral(node, cfg);
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
	} else if (ts.isJsxElement(node) && hasJsxTextChildren(node, cfg)) {
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
				simple = false;
				phrase += `<#${++gpart}>`;
				args.push(visitNode(child.expression, context, cfg));
			} else if (ts.isJsxSelfClosingElement(child)) {
				simple = false;
				phrase += `<${++gpart}/>`;
				args.push(jsxTagToObject(child, context, cfg));
			} else {
				log(child);
				throw new Error('Not supproted');
			}
		}, args);

		phrase = phrase.trim();

		if (!hasText || !isHumanText(phrase, node)) {
			return node;
		}

		savePhrase(phrase);

		if (simple) {
			return ts.updateJsxElement(
				node,
				node.openingElement,
				[ts.createJsxExpression(undefined, ts.createCall(
					i18nId(cfg),
					[],
					[].concat(
						createLiteral(phrase),
						args.length ? ts.createArrayLiteral(args) : [],
					),
				))],
				node.closingElement,
			);
		}

		const callExp = ts.createCall(
			i18nId(cfg, 'jsx'),
			[],
			[
				createLiteral(phrase),
				ts.createArrayLiteral([
					jsxTagToObject(node, context, cfg),
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

function visitNodeAndChildren(node: ts.Node, context, cfg: Config) {
	return ts.visitEachChild(
		visitNode(node, context, cfg),
		(childNode) => visitNodeAndChildren(childNode, context, cfg),
		context,
	);
}

const R_IS_TAG = /^[a-z0-9:]+$/;

function isTagName(name: string) {
	return R_IS_TAG.test(name);
}

function jsxTagToObject(node: ts.JsxElement | ts.JsxSelfClosingElement, context, cfg: Config) {
	const element = ts.isJsxElement(node) ? node.openingElement : node;
	const {attributes} = element;

	let type = element.tagName.getFullText();
	let props: ts.ObjectLiteralElementLike[] = [];

	attributes.properties.forEach(prop => {
		if (ts.isJsxAttribute(prop)) {
			const {initializer} = prop;
			let name = prop.name.getText();
			let value: ts.Expression = null;

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
			}

			props.push(ts.createPropertyAssignment(
				stringifyObjectKey(name),
				value ? value : ts.createNull(),
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
>>

export default function transformerFactory(config: TXConfig) {
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
				isHumanText: (value: string) => /[\wа-яё]/.test(value.trim().replace(/\d+([^\s]+)?/g, '').trim()),
				isTranslatableJsxAttribute: (attr: ts.JsxAttribute) => /^(title|alt|placeholder|value)$/.test(attr.name.getText()),
				...config,
			};

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
