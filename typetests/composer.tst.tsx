import React, { createContext, type Context, type JSX, type ReactNode } from "react";
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
const InferredContext = createContext({ a: 1, b: "x" });
const SymbolContext = createContext<symbol>(Symbol("default"));
const DateContext = createContext(new Date());
const MapContext = createContext(new Map<string, number>());
const SetContext = createContext<Set<number>>(new Set());
const PromiseContext = createContext<Promise<number>>(Promise.resolve(1));
const RecordContext = createContext<Record<string, number>>({});
const IndexContext = createContext<{ [key: string]: number; fixed: number }>({ fixed: 1 });
const ReadonlyObjectContext = createContext<{ readonly a: number }>({ a: 1 });
const VoidContext = createContext<void>(undefined);
const NeverContext = createContext<never>(null as never);
const NullableFunctionContext = createContext<((value: number) => string) | null>(null);
const CallbacksContext = createContext<{ onChange?: (value: number) => void }>({});
const ObjectArrayContext = createContext<{ id: number }[]>([]);
const UnionObjectContext = createContext<{ a: number } | { b: string }>({ a: 1 });
const GenericFunctionContext = createContext<<T>(value: T) => T>((value) => value);
const AsyncFunctionContext = createContext<(id: number) => Promise<string>>(async () => "");
const TemplateContext = createContext<`id-${number}`>("id-1");

class Store {
  value = 1;
}
const ClassContext = createContext(new Store());

type Id = number & { __brand: "id" };
const BrandContext = createContext<Id>(0 as Id);

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

describe("inferred context types", () => {
  test("context type inferred from the default value", () => {
    composeContexts([[InferredContext, { a: 2, b: "y" }]]);

    // @ts-expect-error Property 'b' is missing in type '{ a: number; }' but required in type '{ a: number; b: string; }'.
    composeContexts([[InferredContext, { a: 2 }]]);
  });

  test("context created via React namespace", () => {
    composeContexts([[React.createContext(0), 1]]);

    // @ts-expect-error Type 'string' is not assignable to type 'number'.
    composeContexts([[React.createContext(0), "1"]]);
  });
});

describe("special primitive types", () => {
  test("symbol", () => {
    composeContexts([[SymbolContext, Symbol("value")]]);

    // @ts-expect-error Type 'string' is not assignable to type 'symbol'.
    composeContexts([[SymbolContext, "value"]]);
  });

  test("template literal", () => {
    composeContexts([[TemplateContext, "id-5"]]);

    // @ts-expect-error Type '"id-x"' is not assignable to type '`id-${number}`'.
    composeContexts([[TemplateContext, "id-x"]]);
  });

  test("branded type", () => {
    composeContexts([[BrandContext, 5 as Id]]);

    // @ts-expect-error Type 'number' is not assignable to type 'Id'.
    composeContexts([[BrandContext, 5]]);
  });

  test("void", () => {
    composeContexts([[VoidContext, undefined]]);

    // @ts-expect-error Type 'number' is not assignable to type 'void'.
    composeContexts([[VoidContext, 1]]);
  });

  test("never", () => {
    // @ts-expect-error Type 'number' is not assignable to type 'never'.
    composeContexts([[NeverContext, 1]]);
  });
});

describe("special values", () => {
  test("any value is accepted by a typed context", () => {
    const value: any = "not a number";

    composeContexts([[NumberContext, value]]);
  });

  test("unknown value is rejected by a typed context", () => {
    const value: unknown = 1;

    // @ts-expect-error Type 'unknown' is not assignable to type 'number'.
    composeContexts([[NumberContext, value]]);
  });

  test("never value is accepted by any context", () => {
    const value = null as never;

    composeContexts([[NumberContext, value]]);
  });

  test("as const values", () => {
    composeContexts([[NumberContext, 1 as const]]);
    composeContexts([[NumberContext, 1] as const]);
    composeContexts([[LiteralContext, "dark" as const]]);
  });
});

describe("built-in objects", () => {
  test("Date", () => {
    composeContexts([[DateContext, new Date()]]);

    // @ts-expect-error Type 'string' is not assignable to type 'Date'.
    composeContexts([[DateContext, "2020-01-01"]]);
  });

  test("Map and Set", () => {
    composeContexts([[MapContext, new Map()]]);
    composeContexts([[SetContext, new Set([1])]]);

    // @ts-expect-error Type 'Map<string, string>' is not assignable to type 'Map<string, number>'.
    composeContexts([[MapContext, new Map<string, string>()]]);
    // @ts-expect-error Type 'Set<string>' is not assignable to type 'Set<number>'.
    composeContexts([[SetContext, new Set(["1"])]]);
  });

  test("Promise", () => {
    composeContexts([[PromiseContext, Promise.resolve(2)]]);

    // @ts-expect-error Type 'number' is not assignable to type 'Promise<number>'.
    composeContexts([[PromiseContext, 1]]);
    // @ts-expect-error Type 'Promise<string>' is not assignable to type 'Promise<number>'.
    composeContexts([[PromiseContext, Promise.resolve("1")]]);
  });

  test("class instance and structural typing", () => {
    composeContexts([[ClassContext, new Store()]]);
    composeContexts([[ClassContext, { value: 2 }]]);

    // @ts-expect-error Type 'string' is not assignable to type 'number'.
    composeContexts([[ClassContext, { value: "1" }]]);
  });
});

describe("more object shapes", () => {
  test("Record", () => {
    composeContexts([[RecordContext, {}]]);
    composeContexts([[RecordContext, { x: 1, y: 2 }]]);

    // @ts-expect-error Type 'string' is not assignable to type 'number'.
    composeContexts([[RecordContext, { x: "1" }]]);
  });

  test("index signature with a fixed field", () => {
    composeContexts([[IndexContext, { fixed: 1, other: 2 }]]);

    // @ts-expect-error Type 'string' is not assignable to type 'number'.
    composeContexts([[IndexContext, { fixed: 1, other: "2" }]]);
    // @ts-expect-error Property 'fixed' is missing in type '{ other: number; }' but required in type '{ [key: string]:
    composeContexts([[IndexContext, { other: 2 }]]);
  });

  test("readonly fields", () => {
    composeContexts([[ReadonlyObjectContext, { a: 2 }]]);
  });

  test("non-discriminated union", () => {
    composeContexts([[UnionObjectContext, { a: 1 }]]);
    composeContexts([[UnionObjectContext, { b: "x" }]]);

    // @ts-expect-error Object literal may only specify known properties, and 'c' does not exist in
    composeContexts([[UnionObjectContext, { c: 1 }]]);
  });

  test("array of objects", () => {
    composeContexts([[ObjectArrayContext, [{ id: 1 }, { id: 2 }]]]);

    // @ts-expect-error Object literal may only specify known properties, and 'extra' does not exist in type '{ id: number; }'.
    composeContexts([[ObjectArrayContext, [{ id: 1, extra: true }]]]);
    // @ts-expect-error Property 'id' is missing in type '{}' but required in type '{ id: number; }'.
    composeContexts([[ObjectArrayContext, [{}]]]);
  });

  test("excess properties are allowed for an as const list from a variable", () => {
    const list = [[ObjectContext, { color: "red", extra: true }]] as const;

    composeContexts(list);
  });
});

describe("more function shapes", () => {
  test("nullable function", () => {
    composeContexts([[NullableFunctionContext, null]]);
    composeContexts([
      [
        NullableFunctionContext,
        (value) => {
          expect(value).type.toBe<number>();
          return "";
        },
      ],
    ]);

    // @ts-expect-error Type 'undefined' is not assignable to
    composeContexts([[NullableFunctionContext, undefined]]);
    // @ts-expect-error Property 'toUpperCase' does not exist on type 'number'.
    composeContexts([[NullableFunctionContext, (value) => value.toUpperCase()]]);
  });

  test("optional callback in an object", () => {
    composeContexts([[CallbacksContext, {}]]);
    composeContexts([
      [
        CallbacksContext,
        {
          onChange: (value) => {
            expect(value).type.toBe<number>();
          },
        },
      ],
    ]);
    composeContexts([
      [
        CallbacksContext,
        {
          onChange(value) {
            expect(value).type.toBe<number>();
          },
        },
      ],
    ]);

    // @ts-expect-error Object literal may only specify known properties, but 'onChang' does not exist in
    composeContexts([[CallbacksContext, { onChang: () => {} }]]);
  });

  test("async function", () => {
    composeContexts([
      [
        AsyncFunctionContext,
        async (id) => {
          expect(id).type.toBe<number>();
          return id.toFixed();
        },
      ],
    ]);

    // @ts-expect-error Type '(id: number) => string' is not assignable to type '(id: number) => Promise<string>'.
    composeContexts([[AsyncFunctionContext, (id: number) => id.toFixed()]]);
    // @ts-expect-error Type 'Promise<number>' is not assignable to type 'Promise<string>'.
    composeContexts([[AsyncFunctionContext, async (id) => id]]);
  });

  test("generic function", () => {
    composeContexts([[GenericFunctionContext, (value) => value]]);
    composeContexts([[GenericFunctionContext, <T,>(value: T) => value]]);

    // @ts-expect-error Type '(value: number) => number' is not assignable to type '<T>(value: T) => T'.
    composeContexts([[GenericFunctionContext, (value: number) => value]]);
  });
});

describe("more list forms", () => {
  test("spread of as const lists", () => {
    const numbers = [[NumberContext, 1]] as const;
    const strings = [[StringContext, "a"]] as const;

    composeContexts([...numbers, ...strings]);
    // @ts-expect-error Type 'number' is not assignable to type 'string'.
    composeContexts([...numbers, ...strings, [StringContext, 1]]);
  });

  test("tuples stored in variables", () => {
    const mutable: [Context<number>, number] = [NumberContext, 1];
    const readonly: readonly [Context<number>, number] = [NumberContext, 1];

    composeContexts([mutable, readonly]);
  });

  test("tuples declared with as const one by one", () => {
    composeContexts([[NumberContext, 1] as const, [StringContext, "a"] as const]);

    // @ts-expect-error Type 'number' is not assignable to type 'string'.
    composeContexts([[NumberContext, 1] as const, [StringContext, 2] as const]);
  });

  test("readonly typed list", () => {
    const list: ReadonlyArray<readonly [Context<number>, number]> = [];

    composeContexts(list);
  });

  test("a list without as const is rejected", () => {
    const list = [[NumberContext, 1]];

    // @ts-expect-error Argument of type '(number | Context<number>)[][]' is not assignable to parameter of type
    composeContexts(list);
  });

  test("a long list", () => {
    const item = [NumberContext, 1] as const;

    composeContexts([
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
      item,
    ]);
  });
});

function provide<T>(context: Context<T>, value: T) {
  return composeContexts([
    [context, value],
    [StringContext, "a"],
  ]);
}

describe("generic wrappers", () => {
  test("can be used inside a generic function", () => {
    expect(provide(NumberContext, 1)).type.toBe<(children: ReactNode) => JSX.Element>();
  });
});
