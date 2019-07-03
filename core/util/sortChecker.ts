import { expect } from 'chai';

export const checkSort = <T>(data: Array<T>, compareFn: (a: T, b: T) => number): boolean => {
    const dataCopy = [...data];
    dataCopy.sort(compareFn);

    try {
        expect(dataCopy).to.eql(data);
    } catch (error) {
        return false;
    }

    return true;
};
