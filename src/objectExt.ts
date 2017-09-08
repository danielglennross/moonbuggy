'use strict';

export function getNonEnumerableEntries<T>(object: { [s: string]: T }): [string, T][] {
  return Object.getOwnPropertyNames(object).map((key: string) => <[string, T]>[key, object[key]]);
}
