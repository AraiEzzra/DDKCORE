export function shuffle(array: Array<any>): Array<any> {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function getRandomInt(min, max): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

export function toSnakeCase(str) {
    function upperToHyphenLower(match) {
        return '_' + match.toLowerCase();
    }

    return str.replace(/[A-Z]/g, upperToHyphenLower);
}
