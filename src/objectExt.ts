'use strict';

export function getNonEnumerableEntries<T>(object: { [s: string]: T }): [string, T][] {
  return Object.getOwnPropertyNames(object).map((key: string) => <[string, T]>[key, object[key]]);
}

export async function tuple<T>(promise: T | Promise<T>): Promise<[T, any]> {  
  try {
    const data = await promise;
    return <[any, T]>[data, null];
  } catch (err) {
    return <[any, T]>[null, err]
  }
}
