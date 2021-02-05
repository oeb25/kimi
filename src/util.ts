import * as React from "react";

export function keys<T>(t: T): (keyof T)[] {
  return Object.keys(t) as (keyof T)[];
}
export function entries<T>(t: T): { [K in keyof T]: [K, T[K]] }[keyof T][] {
  return Object.entries(t) as { [K in keyof T]: [K, T[K]] }[keyof T][];
}
export function values<T>(t: T): { [K in keyof T]: T[K] }[keyof T][] {
  return Object.values(t) as { [K in keyof T]: T[K] }[keyof T][];
}
export function mapValues<T>(
  t: T,
  // f: { [K in keyof T]: (key: K, value: T[K]) => T[K] }[keyof T]
  f: (key: keyof T, value: T[keyof T]) => T[keyof T]
): T {
  const out = {} as T;
  entries(t).map(([k, v]) => (out[k] = f(k, v)));
  return out;
}

export const intersperse = <T>(xs: T[], e: React.ReactElement) => {
  const out = [];
  for (let i = 0; i < xs.length; i++) {
    out.push(xs[i]);
    if (i + 1 != xs.length) {
      out.push(React.cloneElement(e, { key: `interspersed-${i}` }));
    }
  }
  return out;
};
