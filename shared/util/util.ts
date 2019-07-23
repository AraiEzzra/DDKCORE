import { Direction } from 'shared/util/common';

export function getRandomInt(min, max): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

export function toSnakeCase(str) {
    function upperToHyphenLower(match) {
        return '_' + match.toLowerCase();
    }

    return str.replace(/[A-Z]/g, upperToHyphenLower);
}

export function sortByKey(key: string, direction?: Direction): (a: any, b: any) => number {
    const path = key.split('.');

    return (a: { key: any } & any, b: { key: any } & any): number => {
        const aValue = path.reduce((current, value) => current[value], a);
        const bValue = path.reduce((current, value) => current[value], b);

        if (aValue > bValue) {
            return direction === 'ASC' ? 1 : -1;
        }
        if (aValue < bValue) {
            return direction === 'ASC' ? -1 : 1;
        }
        return 0;
    };
}

export const diffArray = <T>(arrayA: Array<T>, arrayB: Array<T>): Array<T> => {
    const set = new Set([...arrayB]);
    return arrayA.filter(str => !set.has(str));
};
