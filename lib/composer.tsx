import { type Context, type ReactNode } from "react";

type ContextTuple<C> = readonly [Context<C>, NoInfer<C>];

type ContextValues<T extends readonly unknown[]> = {
  readonly [K in keyof T]: ContextTuple<T[K]>;
};

export function composeContexts<const T extends readonly unknown[]>(wrappers: ContextValues<T>) {
  return (children: ReactNode) => (
    <>
      {wrappers.reduceRight(
        (acc, [Context, value]) => (
          <Context.Provider value={value}>{acc}</Context.Provider>
        ),
        children,
      )}
    </>
  );
}
