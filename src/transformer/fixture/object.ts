const short = false;
const obj = {
	short,
	foo: 'bar',
	'hello': 'world',
	'bar-qux': 'wow',
	[`interpolated ${123}`]: 'ok',
};
const inArray = [
	{
		value: 'Username',
	},
];

obj['property'] = 'yes';
obj[`property: ${321}`] = `wow`;