import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const defaultValue = [91291312402, 0, 0, 0, 0, 0];

const initialValue = browser
	? JSON.parse(window.localStorage.getItem('userCoords') ?? JSON.stringify(defaultValue))
	: defaultValue;

const userCoords = writable<number[]>(initialValue);

userCoords.subscribe((value) => {
	if (browser) {
		window.localStorage.setItem('userCoords', JSON.stringify(value));
	}
});

export default userCoords;
