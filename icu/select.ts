export type SubMessages<V extends string> = {
	readonly [K in V]?: string;
} & {
	readonly other: string;
}

export function select<
	V extends string,
	SM extends SubMessages<V>,
>(val: V, subMessages: SM): SM[V] {
	if (subMessages.hasOwnProperty(val)) {
		return subMessages[val];
	}

	return subMessages[subMessages.hasOwnProperty(val) ? val : 'other'] as SM[V];
}
