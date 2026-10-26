import { createContext, type Context, type JSX, type ReactNode } from "react";
import { describe, expectTypeOf, it } from "vitest";
import { composeContexts } from "../lib";

enum Language {
  ru = "ru",
  en = "en",
}

type Theme = { color: string; size?: number };

const NumberContext = createContext(0);
const StringContext = createContext("");
const LiteralContext = createContext<"light" | "dark">("light");
const EnumContext = createContext(Language.en);
const ObjectContext = createContext<Theme>({ color: "red" });
const NullableContext = createContext<string | null>(null);
const OptionalContext = createContext<number | undefined>(undefined);
const ArrayContext = createContext<number[]>([]);
const ReadonlyArrayContext = createContext<readonly string[]>([]);
const TupleContext = createContext<[number, string]>([0, ""]);
const FunctionContext = createContext<(value: number) => string>(String);
const UnionContext = createContext<{ kind: "a"; a: number } | { kind: "b"; b: string }>({
  kind: "a",
  a: 0,
});
const UnknownContext = createContext<unknown>(null);
const AnyContext = createContext<any>(null);
const NeverNullContext = createContext<{ id: number }>({ id: 0 });

describe("return type", () => {
  it("returns a function from children to JSX element", () => {
    expectTypeOf(composeContexts([[NumberContext, 1]])).toEqualTypeOf<
      (children: ReactNode) => JSX.Element
    >();
  });

  it("returns the same type for an empty list", () => {
    expectTypeOf(composeContexts([])).toEqualTypeOf<(children: ReactNode) => JSX.Element>();
  });

  it("accepts any ReactNode as children", () => {
    const compose = composeContexts([[NumberContext, 1]]);

    expectTypeOf(compose).parameter(0).toEqualTypeOf<ReactNode>();
    compose(null);
    compose(undefined);
    compose("text");
    compose(1);
    compose(false);
    compose([<i key="a" />, "b"]);
    compose(<div />);
  });

  it("requires children argument", () => {
    // @ts-expect-error children are required
    composeContexts([[NumberContext, 1]])();
  });
});

describe("valid values", () => {
  it("accepts primitive values", () => {
    composeContexts([[NumberContext, 1]]);
    composeContexts([[NumberContext, 0]]);
    composeContexts([[NumberContext, Number.NaN]]);
    composeContexts([[StringContext, "text"]]);
    composeContexts([[StringContext, ""]]);
  });

  it("accepts literal and enum values", () => {
    composeContexts([[LiteralContext, "dark"]]);
    composeContexts([[EnumContext, Language.ru]]);
  });

  it("accepts objects, including optional fields", () => {
    composeContexts([[ObjectContext, { color: "blue" }]]);
    composeContexts([[ObjectContext, { color: "blue", size: 1 }]]);
  });

  it("accepts nullable and optional values", () => {
    composeContexts([[NullableContext, null]]);
    composeContexts([[NullableContext, "text"]]);
    composeContexts([[OptionalContext, undefined]]);
    composeContexts([[OptionalContext, 1]]);
  });

  it("accepts arrays and tuples", () => {
    composeContexts([[ArrayContext, []]]);
    composeContexts([[ArrayContext, [1, 2, 3]]]);
    composeContexts([[ReadonlyArrayContext, ["a"]]]);
    composeContexts([[TupleContext, [1, "a"]]]);
  });

  it("accepts functions with a compatible signature", () => {
    composeContexts([[FunctionContext, (value: number) => value.toFixed()]]);
    composeContexts([[FunctionContext, () => "constant"]]);
    composeContexts([[FunctionContext, String]]);
  });

  it("accepts discriminated union members", () => {
    composeContexts([[UnionContext, { kind: "a", a: 1 }]]);
    composeContexts([[UnionContext, { kind: "b", b: "x" }]]);
  });

  it("accepts anything for unknown and any contexts", () => {
    composeContexts([[UnknownContext, { anything: true }]]);
    composeContexts([[UnknownContext, null]]);
    composeContexts([[AnyContext, 1]]);
  });

  it("accepts many contexts of different types at once", () => {
    composeContexts([
      [NumberContext, 1],
      [StringContext, "a"],
      [LiteralContext, "dark"],
      [EnumContext, Language.ru],
      [ObjectContext, { color: "blue" }],
      [NullableContext, null],
      [OptionalContext, undefined],
      [ArrayContext, [1]],
      [TupleContext, [1, "a"]],
      [FunctionContext, (value: number) => String(value)],
      [UnionContext, { kind: "b", b: "x" }],
    ]);
  });

  it("accepts the same context several times", () => {
    composeContexts([
      [NumberContext, 1],
      [NumberContext, 2],
    ]);
  });

  it("accepts values stored in variables", () => {
    const constant = 5;
    let mutable = 5;
    mutable += 1;
    const theme: Theme = { color: "green" };

    composeContexts([[NumberContext, constant]]);
    composeContexts([[NumberContext, mutable]]);
    composeContexts([[ObjectContext, theme]]);
  });

  it("accepts a list declared with as const", () => {
    const list = [
      [NumberContext, 1],
      [LiteralContext, "dark"],
    ] as const;

    composeContexts(list);
  });

  it("accepts a typed dynamic list", () => {
    const list: Array<readonly [Context<number>, number]> = [];

    composeContexts(list);
  });

  it("accepts a context typed via Context<T>", () => {
    const context: Context<string> = StringContext;

    composeContexts([[context, "a"]]);
  });
});

describe("invalid values", () => {
  it("rejects a value of a different primitive type", () => {
    // @ts-expect-error string is not a number
    composeContexts([[NumberContext, "1"]]);
    // @ts-expect-error number is not a string
    composeContexts([[StringContext, 1]]);
  });

  it("rejects literals outside of the union", () => {
    // @ts-expect-error "blue" is not "light" | "dark"
    composeContexts([[LiteralContext, "blue"]]);
  });

  it("rejects plain strings for enum contexts", () => {
    // @ts-expect-error plain string is not an enum member
    composeContexts([[EnumContext, "ru"]]);
  });

  it("rejects null and undefined for non-nullable contexts", () => {
    // @ts-expect-error null is not a number
    composeContexts([[NumberContext, null]]);
    // @ts-expect-error undefined is not a number
    composeContexts([[NumberContext, undefined]]);
    // @ts-expect-error null is not an object
    composeContexts([[NeverNullContext, null]]);
  });

  it("rejects values of a wrong type in nullable contexts", () => {
    // @ts-expect-error number is not string | null
    composeContexts([[NullableContext, 1]]);
    // @ts-expect-error undefined is not string | null
    composeContexts([[NullableContext, undefined]]);
  });

  it("rejects objects with missing or wrong fields", () => {
    // @ts-expect-error required field is missing
    composeContexts([[ObjectContext, {}]]);
    // @ts-expect-error field has a wrong type
    composeContexts([[ObjectContext, { color: 1 }]]);
    // @ts-expect-error optional field has a wrong type
    composeContexts([[ObjectContext, { color: "red", size: "big" }]]);
  });

  it("rejects wrong array and tuple values", () => {
    // @ts-expect-error array of strings is not number[]
    composeContexts([[ArrayContext, ["1"]]]);
    // @ts-expect-error tuple items are swapped
    composeContexts([[TupleContext, ["a", 1]]]);
  });

  it("rejects a function with an incompatible signature", () => {
    // @ts-expect-error parameter type does not match
    composeContexts([[FunctionContext, (value: string) => value]]);
    // @ts-expect-error return type does not match
    composeContexts([[FunctionContext, (value: number) => value]]);
  });

  it("rejects mixed discriminated union members", () => {
    // @ts-expect-error field "b" does not belong to kind "a"
    composeContexts([[UnionContext, { kind: "a", b: "x" }]]);
  });

  it("finds the wrong value in the middle of a list", () => {
    composeContexts([
      [NumberContext, 1],
      // @ts-expect-error number is not a string
      [StringContext, 2],
      [LiteralContext, "dark"],
    ]);
  });

  it("rejects wrong values in an as const list", () => {
    const list = [
      [NumberContext, 1],
      [LiteralContext, "blue"],
    ] as const;

    // @ts-expect-error "blue" is not "light" | "dark"
    composeContexts(list);
  });

  it("rejects a typed variable of a wrong type", () => {
    const value: string = "1";

    // @ts-expect-error string is not a number
    composeContexts([[NumberContext, value]]);
  });

  it("rejects a value that is wider than the context type", () => {
    const value = "dark" as string;

    // @ts-expect-error string is wider than "light" | "dark"
    composeContexts([[LiteralContext, value]]);
  });
});

describe("invalid list shape", () => {
  it("rejects a tuple without a value", () => {
    // @ts-expect-error value is missing
    composeContexts([[NumberContext]]);
  });

  it("rejects a tuple with extra items", () => {
    // @ts-expect-error extra item in the tuple
    composeContexts([[NumberContext, 1, 2]]);
  });

  it("rejects something that is not a context", () => {
    // @ts-expect-error first item must be a context
    composeContexts([[1, 1]]);
    // @ts-expect-error first item must be a context
    composeContexts([[{ Provider: null }, 1]]);
  });

  it("rejects a context without a tuple", () => {
    // @ts-expect-error each item must be a tuple
    composeContexts([NumberContext]);
  });

  it("rejects a non-array argument", () => {
    // @ts-expect-error argument must be a list
    composeContexts([NumberContext, 1] as const);
    // @ts-expect-error argument must be a list
    composeContexts(NumberContext);
    // @ts-expect-error argument is required
    composeContexts();
  });
});
