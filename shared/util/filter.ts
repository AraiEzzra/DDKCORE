export const isFiltered = (filter: { [key: string]: any } = {}, filterKeys: Set<string> = new Set()) => {
    if (filterKeys.size) {
        return !!Object.keys(filter).filter(key => filterKeys.has(key)).length;
    }
    return !!Object.keys(filter).length;
};
