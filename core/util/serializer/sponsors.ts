class SponsorsSerializer {
    serialize(sponsors: Map<BigInt, number>): Array<[string, number]> {
        return Array.from(sponsors).map(elem => [elem[0].toString(), elem[1]]);
    }

    deserialize(data: Array<[string, number]>): Map<BigInt, number> {
        return new Map(data.map((elem) => [BigInt(elem[0]), elem[1]]));
    }
}

export default new SponsorsSerializer();
