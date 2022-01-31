import { enPlural as plural } from '../../../icu/plural/en';

console.log(`You have ${plural(5, {one: '# message', other: '# messages'})}.`);
console.log(plural(0, {one: '# message', other: '# messages'}));

export function pluralMessages(num: number) {
	return plural(num, {one: 'message', other: 'messages'});
}