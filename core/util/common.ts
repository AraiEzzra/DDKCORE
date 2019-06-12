export function getRandomInt(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
}

export function getRandom<T>(array: Array<T>): T {
    return array[getRandomInt(array.length)];
}

export function getRandomElements<T>(limit: number, array: Array<T>): Array<T> {
    if (array.length <= limit) {
        return array;
    }
    const result = [];
    while (result.length < limit) {
        const i = getRandomInt(array.length);
        const temp = array[i];
        if (result.indexOf(temp) === -1) {
            result.push(temp);
        }
    }
    return result;
}

export const compose = (...fns): any => {
    return fns.reduceRight((prevFn, nextFn) =>
        (...args) => nextFn(prevFn(...args)),
        value => value
    );
};

export const isEqualMaps = (map1: Map<any, any>, map2: Map<any, any>) => {
    let testVal;
    if (map1.size !== map2.size) {
        return false;
    }
    for (let [key, val] of map1) {
        testVal = map2.get(key);
        // in cases of an undefined value, make sure the key
        // actually exists on the object so there are no false positives
        if (testVal !== val || (testVal === undefined && !map2.has(key))) {
            return false;
        }
    }
    return true;
};

export const IPRegExp = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
