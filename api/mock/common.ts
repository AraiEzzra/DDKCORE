export const getRandomNumber = (from: number, to: number) => {
    return Math.floor(Math.random() * to) + from;
};
