export function setTitle(title : undefined | string) {
	document.title = (typeof title === 'undefined' || title === '')
		? 'Caja Ica'
		: `${title} | Caja Ica`
}
