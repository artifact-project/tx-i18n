import * as ts from 'typescript';

export type HumanTextChecker = (text: string, node: ts.Node) => boolean;

export interface Config {
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
};

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
};

export type ContextedPhrases = {
	[context: string]: Phrase[];
};

export type InlineConfig = {
	context: string;
	normalize: string;
	isJSXExpr: boolean;
};

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
>>;
