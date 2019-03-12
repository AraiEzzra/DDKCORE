export function getRandomInt(max: number): number {
  return Math.floor(Math.random() * Math.floor(max));
}

export const compose = (...fns): any => {
  return fns.reduceRight((prevFn, nextFn) =>
    (...args) => nextFn(prevFn(...args)),
    value => value
  );
};
