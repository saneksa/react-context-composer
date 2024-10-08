import { type Context, type ReactNode } from "react";

type ContextTuple<C, V = C> = readonly [Context<C>, V];

type ContextValues<T> = {
  [K in keyof T]: T[K] extends ContextTuple<infer C, infer V>
    ? V extends C
      ? ContextTuple<C, V>
      : ContextTuple<C>
    : ContextTuple<any>;
} & ReadonlyArray<ContextTuple<any>>;

export function composeContexts<const T extends ContextValues<T>>(wrappers: T) {
  return (children: ReactNode) =>
    wrappers.reduceRight(
      (acc, [Context, value]) => (
        <Context.Provider value={value}>{acc}</Context.Provider>
      ),
      children
    );
}
