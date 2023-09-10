import { type Context, type ReactNode } from "react";

type ContextValues<
  T extends readonly (readonly [Context<unknown>, unknown])[],
> = {
  readonly [K in keyof T]: T[K] extends readonly [Context<infer C>, infer V]
    ? V extends C
      ? readonly [Context<C>, V]
      : readonly [Context<C>, C]
    : never;
};

export function composeContexts<
  V extends readonly (readonly [Context<any>, any])[],
>(children: ReactNode, wrappers: ContextValues<V>) {
  return wrappers.reduceRight(
    (acc, [Context, value]) => (
      <Context.Provider value={value}>{acc}</Context.Provider>
    ),
    children
  );
}
