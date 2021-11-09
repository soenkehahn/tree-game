export function wait(length: number) {
  return new Promise((resolve) => setTimeout(resolve, length * 1000));
}

export function trace<T>(t: T): T {
  console.log(t);
  return t;
}

export function assert(condition: boolean) {
  if (!condition) {
    throw `assertion failed`;
  }
}
