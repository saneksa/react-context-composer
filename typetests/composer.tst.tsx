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

    expect(compose).type.toBeCallableWith(null);
    expect(compose).type.toBeCallableWith(undefined);
    expect(compose).type.toBeCallableWith("text");
    expect(compose).type.toBeCallableWith(1);
    expect(compose).type.toBeCallableWith(false);
    expect(compose).type.toBeCallableWith([<i key="a" />, "b"]);
    expect(compose).type.toBeCallableWith(<div />);

    expect(compose).type.not.toBeCallableWith();
    expect(compose).type.not.toBeCallableWith({ notANode: true });
  });
});

describe("primitive values", () => {
  test("number", () => {
    expect(composeContexts).type.toBeCallableWith([[NumberContext, 1]]);
    expect(composeContexts).type.toBeCallableWith([[NumberContext, 0]]);
    expect(composeContexts).type.toBeCallableWith([[NumberContext, Number.NaN]]);

    expect(composeContexts).type.not.toBeCallableWith([[NumberContext, "1"]]);
    expect(composeContexts).type.not.toBeCallableWith([[NumberContext, null]]);
    expect(composeContexts).type.not.toBeCallableWith([[NumberContext, undefined]]);
  });

  test("string", () => {
    expect(composeContexts).type.toBeCallableWith([[StringContext, "text"]]);
    expect(composeContexts).type.toBeCallableWith([[StringContext, ""]]);

    expect(composeContexts).type.not.toBeCallableWith([[StringContext, 1]]);
  });

  test("literal union", () => {
    expect(composeContexts).type.toBeCallableWith([[LiteralContext, "dark"]]);

    expect(composeContexts).type.not.toBeCallableWith([[LiteralContext, "blue"]]);
  });

  test("literal union does not accept a wider type", () => {
    const value = "dark" as string;

    expect(composeContexts).type.not.toBeCallableWith([[LiteralContext, value]]);
  });

  test("enum", () => {
    expect(composeContexts).type.toBeCallableWith([[EnumContext, Language.ru]]);

    expect(composeContexts).type.not.toBeCallableWith([[EnumContext, "ru"]]);
  });
});

describe("nullable values", () => {
  test("string | null", () => {
    expect(composeContexts).type.toBeCallableWith([[NullableContext, null]]);
    expect(composeContexts).type.toBeCallableWith([[NullableContext, "text"]]);

    expect(composeContexts).type.not.toBeCallableWith([[NullableContext, 1]]);
    expect(composeContexts).type.not.toBeCallableWith([[NullableContext, undefined]]);
  });

  test("number | undefined", () => {
    expect(composeContexts).type.toBeCallableWith([[OptionalContext, undefined]]);
    expect(composeContexts).type.toBeCallableWith([[OptionalContext, 1]]);

    expect(composeContexts).type.not.toBeCallableWith([[OptionalContext, null]]);
  });

  test("non-nullable object", () => {
    expect(composeContexts).type.not.toBeCallableWith([[ObjectContext, null]]);
  });
});

describe("object values", () => {
  test("required and optional fields", () => {
    expect(composeContexts).type.toBeCallableWith([[ObjectContext, { color: "blue" }]]);
    expect(composeContexts).type.toBeCallableWith([[ObjectContext, { color: "blue", size: 1 }]]);

    expect(composeContexts).type.not.toBeCallableWith([[ObjectContext, {}]]);
    expect(composeContexts).type.not.toBeCallableWith([[ObjectContext, { color: 1 }]]);
    expect(composeContexts).type.not.toBeCallableWith([
      [ObjectContext, { color: "red", size: "big" }],
    ]);
  });

  test("excess properties", () => {
    expect(composeContexts).type.not.toBeCallableWith([
      [ObjectContext, { color: "red", extra: true }],
    ]);
    expect(composeContexts).type.not.toBeCallableWith([[ObjectContext, { color: "red", sise: 1 }]]);
  });

  test("excess properties in nested objects", () => {
    expect(composeContexts).type.toBeCallableWith([[NestedContext, { user: { name: "a" } }]]);

    expect(composeContexts).type.not.toBeCallableWith([
      [NestedContext, { user: { name: "a", age: 1 } }],
    ]);
  });

  test("excess properties are allowed for values from variables, like in Provider", () => {
    const theme: Theme & { extra: boolean } = { color: "red", extra: true };

    expect(composeContexts).type.toBeCallableWith([[ObjectContext, theme]]);
  });

  test("discriminated union", () => {
    expect(composeContexts).type.toBeCallableWith([[UnionContext, { kind: "a", a: 1 }]]);
    expect(composeContexts).type.toBeCallableWith([[UnionContext, { kind: "b", b: "x" }]]);

    expect(composeContexts).type.not.toBeCallableWith([[UnionContext, { kind: "a", b: "x" }]]);
    expect(composeContexts).type.not.toBeCallableWith([[UnionContext, { kind: "c" }]]);
  });
});

describe("array values", () => {
  test("array", () => {
    expect(composeContexts).type.toBeCallableWith([[ArrayContext, []]]);
    expect(composeContexts).type.toBeCallableWith([[ArrayContext, [1, 2, 3]]]);

    expect(composeContexts).type.not.toBeCallableWith([[ArrayContext, ["1"]]]);
  });

  test("readonly array", () => {
    expect(composeContexts).type.toBeCallableWith([[ReadonlyArrayContext, ["a"]]]);

    expect(composeContexts).type.not.toBeCallableWith([[ReadonlyArrayContext, [1]]]);
  });

  test("tuple", () => {
    expect(composeContexts).type.toBeCallableWith([[TupleContext, [1, "a"]]]);

    expect(composeContexts).type.not.toBeCallableWith([[TupleContext, ["a", 1]]]);
    expect(composeContexts).type.not.toBeCallableWith([[TupleContext, [1]]]);
  });
});

describe("function values", () => {
  test("compatible signatures", () => {
    expect(composeContexts).type.toBeCallableWith([
      [FunctionContext, (value: number) => value.toFixed()],
    ]);
    expect(composeContexts).type.toBeCallableWith([[FunctionContext, () => "constant"]]);
    expect(composeContexts).type.toBeCallableWith([[FunctionContext, String]]);
  });

  test("incompatible signatures", () => {
    expect(composeContexts).type.not.toBeCallableWith([
      [FunctionContext, (value: string) => value],
    ]);
    expect(composeContexts).type.not.toBeCallableWith([
      [FunctionContext, (value: number) => value],
    ]);
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

  // Contextual typing does not reach arguments of `toBeCallableWith()`,
  // so inferred parameters are checked with direct calls.
  test("rejects wrong usage of an inferred parameter", () => {
    // @ts-expect-error Property 'toUpperCase' does not exist on type 'number'.
    composeContexts([[FunctionContext, (value) => value.toUpperCase()]]);
  });
});

describe("unknown and any", () => {
  test("accept any value", () => {
    expect(composeContexts).type.toBeCallableWith([[UnknownContext, { anything: true }]]);
    expect(composeContexts).type.toBeCallableWith([[UnknownContext, null]]);
    expect(composeContexts).type.toBeCallableWith([[AnyContext, 1]]);
  });
});

describe("lists", () => {
  test("empty list", () => {
    expect(composeContexts).type.toBeCallableWith([]);
  });

  test("many contexts of different types", () => {
    expect(composeContexts).type.toBeCallableWith([
      [NumberContext, 1],
      [StringContext, "a"],
      [LiteralContext, "dark"],
      [EnumContext, Language.ru],
      [ObjectContext, { color: "blue" }],
      [NullableContext, null],
      [OptionalContext, undefined],
      [ArrayContext, [1]],
      [TupleContext, [1, "a"]],
      [FunctionContext, (value: number) => value.toFixed()],
      [UnionContext, { kind: "b", b: "x" }],
    ]);
  });

  test("the same context several times", () => {
    expect(composeContexts).type.toBeCallableWith([
      [NumberContext, 1],
      [NumberContext, 2],
    ]);
  });

  test("a wrong item in the middle of a list", () => {
    expect(composeContexts).type.not.toBeCallableWith([
      [NumberContext, 1],
      [StringContext, 2],
      [LiteralContext, "dark"],
    ]);
    expect(composeContexts).type.not.toBeCallableWith([
      [NumberContext, 1],
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

    expect(composeContexts).type.toBeCallableWith(valid);
    expect(composeContexts).type.not.toBeCallableWith(invalid);
  });

  test("a typed dynamic list", () => {
    const valid: Array<readonly [Context<number>, number]> = [];
    const invalid: Array<readonly [Context<number>, string]> = [];

    expect(composeContexts).type.toBeCallableWith(valid);
    expect(composeContexts).type.not.toBeCallableWith(invalid);
  });

  test("values from variables", () => {
    const constant = 5;
    let mutable = 5;
    mutable += 1;
    const theme: Theme = { color: "green" };
    const wrong: string = "1";

    expect(composeContexts).type.toBeCallableWith([[NumberContext, constant]]);
    expect(composeContexts).type.toBeCallableWith([[NumberContext, mutable]]);
    expect(composeContexts).type.toBeCallableWith([[ObjectContext, theme]]);

    expect(composeContexts).type.not.toBeCallableWith([[NumberContext, wrong]]);
  });

  test("a context typed via Context<T>", () => {
    const context: Context<string> = StringContext;

    expect(composeContexts).type.toBeCallableWith([[context, "a"]]);
    expect(composeContexts).type.not.toBeCallableWith([[context, 1]]);
  });
});

describe("list shape", () => {
  test("rejects a tuple without a value", () => {
    expect(composeContexts).type.not.toBeCallableWith([[NumberContext]]);
  });

  test("rejects a tuple with extra items", () => {
    expect(composeContexts).type.not.toBeCallableWith([[NumberContext, 1, 2]]);
  });

  test("rejects something that is not a context", () => {
    expect(composeContexts).type.not.toBeCallableWith([[1, 1]]);
    expect(composeContexts).type.not.toBeCallableWith([[{ Provider: null }, 1]]);
  });

  test("rejects a context without a tuple", () => {
    expect(composeContexts).type.not.toBeCallableWith([NumberContext]);
  });

  test("rejects a non-list argument", () => {
    expect(composeContexts).type.not.toBeCallableWith([NumberContext, 1] as const);
    expect(composeContexts).type.not.toBeCallableWith(NumberContext);
    expect(composeContexts).type.not.toBeCallableWith();
  });
});
