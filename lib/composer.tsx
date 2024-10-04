import { type Context, type ReactNode } from "react";

type ContextValues<T> = ReadonlyArray<
  {
    [K in keyof T]: T[K] extends readonly [Context<infer V>, infer V]
      ? readonly [Context<V>, V]
      : T[K] extends readonly [Context<any>, any]
      ? readonly [Context<any>, never]
      : never;
  }[keyof T]
>;

export function composeContexts<T extends ContextValues<T>>(wrappers: T) {
  return (children: ReactNode) =>
    wrappers.reduceRight(
      (acc, [Context, value]) => (
        <Context.Provider value={value}>{acc}</Context.Provider>
      ),
      children
    );
}
