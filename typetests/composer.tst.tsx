import { createContext, type Context, type JSX, type ReactNode } from "react";
import { describe, expect, test } from "tstyche";
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
const NestedContext = createContext<{ user: { name: string } }>({ user: { name: "" } });
const NullableContext = createContext<string | null>(null);
const OptionalContext = createContext<number | undefined>(undefined);
const ArrayContext = createContext<number[]>([]);
const ReadonlyArrayContext = createContext<readonly string[]>([]);
const TupleContext = createContext<[number, string]>([0, ""]);
const FunctionContext = createContext<(value: number) => string>(String);
const HandlerContext = createContext<(event: { id: string }) => void>(() => {});
const ApiContext = createContext<{ load: (id: number) => string }>({ load: String });
const UnionContext = createContext<{ kind: "a"; a: number } | { kind: "b"; b: string }>({
  kind: "a",
  a: 0,
});
const UnknownContext = createContext<unknown>(null);
const AnyContext = createContext<any>(null);

describe("return type", () => {
  test("returns a function from children to JSX element", () => {
    expect(composeContexts([[NumberContext, 1]])).type.toBe<(children: ReactNode) => JSX.Element>();
    expect(composeContexts([])).type.toBe<(children: ReactNode) => JSX.Element>();
  });

  test("accepts any ReactNode as children", () => {
    const compose = composeContexts([[NumberContext, 1]]);

    compose(null);
    compose(undefined);
    compose("text");
    compose(1);
    compose(false);
    compose([<i key="a" />, "b"]);
    compose(<div />);

    // @ts-expect-error Expected 1 arguments, but got 0.
    compose();
    // @ts-expect-error Object literal may only specify known properties, and 'notANode' does not exist
    compose({ notANode: true });
  });
});

describe("primitive values", () => {
  test("number", () => {
    composeContexts([[NumberContext, 1]]);
    composeContexts([[NumberContext, 0]]);
    composeContexts([[NumberContext, Number.NaN]]);

    // @ts-expect-error Type 'string' is not assignable to type 'number'.
    composeContexts([[NumberContext, "1"]]);
    // @ts-expect-error Type 'null' is not assignable to type 'number'.
    composeContexts([[NumberContext, null]]);
    // @ts-expect-error Type 'undefined' is not assignable to type 'number'.
    composeContexts([[NumberContext, undefined]]);
  });

  test("string", () => {
    composeContexts([[StringContext, "text"]]);
    composeContexts([[StringContext, ""]]);

    // @ts-expect-error Type 'number' is not assignable to type 'string'.
    composeContexts([[StringContext, 1]]);
  });

  test("literal union", () => {
    composeContexts([[LiteralContext, "dark"]]);

    // @ts-expect-error Type '"blue"' is not assignable to type
    composeContexts([[LiteralContext, "blue"]]);
  });

  test("literal union does not accept a wider type", () => {
    const value = "dark" as string;

    // @ts-expect-error Type 'string' is not assignable to type
    composeContexts([[LiteralContext, value]]);
  });

  test("enum", () => {
    composeContexts([[EnumContext, Language.ru]]);

    // @ts-expect-error Type '"ru"' is not assignable to type 'Language'.
    composeContexts([[EnumContext, "ru"]]);
  });
});

describe("nullable values", () => {
  test("string | null", () => {
    composeContexts([[NullableContext, null]]);
    composeContexts([[NullableContext, "text"]]);

    // @ts-expect-error Type 'number' is not assignable to type 'string'.
    composeContexts([[NullableContext, 1]]);
    // @ts-expect-error Type 'undefined' is not assignable to type 'string | null'.
    composeContexts([[NullableContext, undefined]]);
  });

  test("number | undefined", () => {
    composeContexts([[OptionalContext, undefined]]);
    composeContexts([[OptionalContext, 1]]);

    // @ts-expect-error Type 'null' is not assignable to type 'number | undefined'.
    composeContexts([[OptionalContext, null]]);
  });

  test("non-nullable object", () => {
    // @ts-expect-error Type 'null' is not assignable to type 'Theme'.
    composeContexts([[ObjectContext, null]]);
  });
});

describe("object values", () => {
  test("required and optional fields", () => {
    composeContexts([[ObjectContext, { color: "blue" }]]);
    composeContexts([[ObjectContext, { color: "blue", size: 1 }]]);

    // @ts-expect-error Property 'color' is missing in type '{}' but required in type 'Theme'.
    composeContexts([[ObjectContext, {}]]);
    // @ts-expect-error Type 'number' is not assignable to type 'string'.
    composeContexts([[ObjectContext, { color: 1 }]]);
    // @ts-expect-error Type 'string' is not assignable to type 'number'.
    composeContexts([[ObjectContext, { color: "red", size: "big" }]]);
  });

  test("excess properties", () => {
    // @ts-expect-error Object literal may only specify known properties, and 'extra' does not exist in type 'Theme'.
    composeContexts([[ObjectContext, { color: "red", extra: true }]]);
    // @ts-expect-error Object literal may only specify known properties, and 'sise' does not exist in type 'Theme'.
    composeContexts([[ObjectContext, { color: "red", sise: 1 }]]);
  });

  test("excess properties in nested objects", () => {
    composeContexts([[NestedContext, { user: { name: "a" } }]]);

    // @ts-expect-error Object literal may only specify known properties, and 'age' does not exist in type '{ name: string; }'.
    composeContexts([[NestedContext, { user: { name: "a", age: 1 } }]]);
  });

  test("excess properties are allowed for values from variables, like in Provider", () => {
    const theme: Theme & { extra: boolean } = { color: "red", extra: true };

    composeContexts([[ObjectContext, theme]]);
  });

  test("discriminated union", () => {
    composeContexts([[UnionContext, { kind: "a", a: 1 }]]);
    composeContexts([[UnionContext, { kind: "b", b: "x" }]]);

    // @ts-expect-error Object literal may only specify known properties, and 'b' does not exist in type '{ kind: "a"; a: number; }'.
    composeContexts([[UnionContext, { kind: "a", b: "x" }]]);
    // @ts-expect-error Type '"c"' is not assignable to type '"a" | "b"'.
    composeContexts([[UnionContext, { kind: "c" }]]);
  });
});

describe("array values", () => {
  test("array", () => {
    composeContexts([[ArrayContext, []]]);
    composeContexts([[ArrayContext, [1, 2, 3]]]);

    // @ts-expect-error Type 'string' is not assignable to type 'number'.
    composeContexts([[ArrayContext, ["1"]]]);
  });

  test("readonly array", () => {
    composeContexts([[ReadonlyArrayContext, ["a"]]]);

    // @ts-expect-error Type 'number' is not assignable to type 'string'.
    composeContexts([[ReadonlyArrayContext, [1]]]);
  });

  test("tuple", () => {
    composeContexts([[TupleContext, [1, "a"]]]);

    // @ts-expect-error Type 'string' is not assignable to type 'number'.
    composeContexts([[TupleContext, ["a", "b"]]]);
    // @ts-expect-error Type '[number]' is not assignable to type '[number, string]'.
    composeContexts([[TupleContext, [1]]]);
  });
});

describe("function values", () => {
  test("compatible signatures", () => {
    composeContexts([[FunctionContext, (value: number) => value.toFixed()]]);
    composeContexts([[FunctionContext, () => "constant"]]);
    composeContexts([[FunctionContext, String]]);
  });

  test("incompatible signatures", () => {
    // @ts-expect-error Type '(value: string) => string' is not assignable to type '(value: number) => string'.
    composeContexts([[FunctionContext, (value: string) => value]]);
    // @ts-expect-error Type '(value: number) => number' is not assignable to type '(value: number) => string'.
    composeContexts([[FunctionContext, (value: number) => value]]);
  });

  test("infers the parameter type from the context", () => {
    composeContexts([
      [
        FunctionContext,
        (value) => {
          expect(value).type.toBe<number>();
          return value.toFixed();
        },
      ],
    ]);
  });

  test("infers parameter types for each item of a list", () => {
    composeContexts([
      [NumberContext, 1],
      [
        FunctionContext,
        (value) => {
          expect(value).type.toBe<number>();
          return "";
        },
      ],
      [
        HandlerContext,
        (event) => {
          expect(event).type.toBe<{ id: string }>();
        },
      ],
    ]);
  });

  test("infers parameter types of object methods", () => {
    composeContexts([
      [
        ApiContext,
        {
          load: (id) => {
            expect(id).type.toBe<number>();
            return "";
          },
        },
      ],
    ]);
  });

  test("rejects wrong usage of an inferred parameter", () => {
    // @ts-expect-error Property 'toUpperCase' does not exist on type 'number'.
    composeContexts([[FunctionContext, (value) => value.toUpperCase()]]);
  });
});

describe("unknown and any", () => {
  test("accept any value", () => {
    composeContexts([[UnknownContext, { anything: true }]]);
    composeContexts([[UnknownContext, null]]);
    composeContexts([[AnyContext, 1]]);
  });
});

describe("lists", () => {
  test("empty list", () => {
    composeContexts([]);
  });

  test("many contexts of different types", () => {
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
      [FunctionContext, (value) => value.toFixed()],
      [UnionContext, { kind: "b", b: "x" }],
    ]);
  });

  test("the same context several times", () => {
    composeContexts([
      [NumberContext, 1],
      [NumberContext, 2],
    ]);
  });

  test("a wrong item in the middle of a list", () => {
    composeContexts([
      [NumberContext, 1],
      // @ts-expect-error Type 'number' is not assignable to type 'string'.
      [StringContext, 2],
      [LiteralContext, "dark"],
    ]);
    composeContexts([
      [NumberContext, 1],
      // @ts-expect-error Object literal may only specify known properties, and 'extra' does not exist in type 'Theme'.
      [ObjectContext, { color: "red", extra: true }],
      [StringContext, "a"],
    ]);
  });

  test("a list declared with as const", () => {
    const valid = [
      [NumberContext, 1],
      [LiteralContext, "dark"],
    ] as const;
    const invalid = [
      [NumberContext, 1],
      [LiteralContext, "blue"],
    ] as const;

    composeContexts(valid);
    // @ts-expect-error Argument of type 'readonly [readonly [Context<number>, 1], readonly [Context<
    composeContexts(invalid);
  });

  test("a typed dynamic list", () => {
    const valid: Array<readonly [Context<number>, number]> = [];
    const invalid: Array<readonly [Context<number>, string]> = [];

    composeContexts(valid);
    // @ts-expect-error Argument of type '(readonly [Context<number>, string])[]' is not assignable
    composeContexts(invalid);
  });

  test("values from variables", () => {
    const constant = 5;
    let mutable = 5;
    mutable += 1;
    const theme: Theme = { color: "green" };
    const wrong: string = "1";

    composeContexts([[NumberContext, constant]]);
    composeContexts([[NumberContext, mutable]]);
    composeContexts([[ObjectContext, theme]]);

    // @ts-expect-error Type 'string' is not assignable to type 'number'.
    composeContexts([[NumberContext, wrong]]);
  });

  test("a context typed via Context<T>", () => {
    const context: Context<string> = StringContext;

    composeContexts([[context, "a"]]);
    // @ts-expect-error Type 'number' is not assignable to type 'string'.
    composeContexts([[context, 1]]);
  });
});

describe("list shape", () => {
  test("rejects a tuple without a value", () => {
    // @ts-expect-error Type 'Context<number>' is not assignable to type 'Context<unknown>'.
    composeContexts([[NumberContext]]);
  });

  test("rejects a tuple with extra items", () => {
    // @ts-expect-error Type 'Context<number>' is not assignable to type 'Context<unknown>'.
    composeContexts([[NumberContext, 1, 2]]);
  });

  test("rejects something that is not a context", () => {
    // @ts-expect-error Type 'number' is not assignable to type 'Context<unknown>'.
    composeContexts([[1, 1]]);
    // @ts-expect-error Type 'null' is not assignable to type 'Provider<unknown>'.
    composeContexts([[{ Provider: null }, 1]]);
  });

  test("rejects a context without a tuple", () => {
    // @ts-expect-error Type 'Context<number>' is not assignable to type 'ContextTuple<unknown>'.
    composeContexts([NumberContext]);
  });

  test("rejects a non-list argument", () => {
    // @ts-expect-error Argument of type 'string' is not assignable to parameter of type
    composeContexts("not a list");
    // @ts-expect-error Type 'Context<number>' is missing the following properties from type 'readonly
    composeContexts(NumberContext);
    // @ts-expect-error Expected 1 arguments, but got 0.
    composeContexts();
  });
});
