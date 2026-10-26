import { createContext, Fragment, useContext, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { composeContexts } from "../lib";

const NumberContext = createContext(0);
const StringContext = createContext("default");
const ObjectContext = createContext<{ id: number } | null>(null);
const FunctionContext = createContext<() => string>(() => "default");
const NullableContext = createContext<string | null>("default");
const UndefinedContext = createContext<number | undefined>(42);

const ReadNumber = () => <>{useContext(NumberContext)}</>;
const ReadString = () => <>{useContext(StringContext)}</>;
const ReadObject = () => <>{`id=${useContext(ObjectContext)?.id}`}</>;
const ReadFunction = () => <>{useContext(FunctionContext)()}</>;
const ReadNullable = () => <>{String(useContext(NullableContext))}</>;
const ReadUndefined = () => <>{String(useContext(UndefinedContext))}</>;

const Deep = () => (
  <div>
    <section>
      <ReadNumber />
    </section>
  </div>
);

const render = (node: ReactNode) => renderToStaticMarkup(<>{node}</>);

describe("composeContexts", () => {
  it("returns a function", () => {
    expect(composeContexts([])).toBeTypeOf("function");
  });

  describe("empty list", () => {
    it("renders children as is", () => {
      expect(render(composeContexts([])(<span>child</span>))).toBe("<span>child</span>");
    });

    it("leaves contexts with default values", () => {
      expect(render(composeContexts([])(<ReadNumber />))).toBe("0");
    });
  });

  describe("providing values", () => {
    it("provides a value for a single context", () => {
      expect(render(composeContexts([[NumberContext, 7]])(<ReadNumber />))).toBe("7");
    });

    it("provides values for several contexts", () => {
      const html = render(
        composeContexts([
          [NumberContext, 1],
          [StringContext, "two"],
          [ObjectContext, { id: 3 }],
        ])(
          <>
            <ReadNumber />|<ReadString />|<ReadObject />
          </>,
        ),
      );

      expect(html).toBe("1|two|id=3");
    });

    it("keeps default values for contexts that are not in the list", () => {
      const html = render(
        composeContexts([[NumberContext, 1]])(
          <>
            <ReadNumber />|<ReadString />
          </>,
        ),
      );

      expect(html).toBe("1|default");
    });

    it.each([
      ["zero", 0, "0"],
      ["negative", -1, "-1"],
      ["NaN", Number.NaN, "NaN"],
    ])("provides falsy-like number %s", (_, value, expected) => {
      expect(render(composeContexts([[NumberContext, value]])(<ReadNumber />))).toBe(expected);
    });

    it("provides an empty string", () => {
      expect(render(composeContexts([[StringContext, ""]])(<ReadString />))).toBe("");
    });

    it("provides null instead of the default value", () => {
      expect(render(composeContexts([[NullableContext, null]])(<ReadNullable />))).toBe("null");
    });

    it("provides undefined instead of the default value", () => {
      expect(render(composeContexts([[UndefinedContext, undefined]])(<ReadUndefined />))).toBe(
        "undefined",
      );
    });

    it("provides a function as a value", () => {
      expect(render(composeContexts([[FunctionContext, () => "custom"]])(<ReadFunction />))).toBe(
        "custom",
      );
    });

    it("passes the same object reference to consumers", () => {
      const value = { id: 1 };
      const received: unknown[] = [];
      const Capture = () => {
        received.push(useContext(ObjectContext));
        return null;
      };

      render(composeContexts([[ObjectContext, value]])(<Capture />));

      expect(received[0]).toBe(value);
    });
  });

  describe("provider order", () => {
    it("makes the last provider of the same context the closest one", () => {
      const html = render(
        composeContexts([
          [NumberContext, 1],
          [NumberContext, 2],
          [NumberContext, 3],
        ])(<ReadNumber />),
      );

      expect(html).toBe("3");
    });

    it("lets later providers read values of earlier ones", () => {
      const Outer = createContext("none");
      const Inner = createContext("none");
      const seen: string[] = [];
      const Spy = () => {
        seen.push(useContext(Outer), useContext(Inner));
        return null;
      };

      render(
        composeContexts([
          [Outer, "outer"],
          [Inner, "inner"],
        ])(<Spy />),
      );

      expect(seen).toEqual(["outer", "inner"]);
    });

    it("nests providers in list order", () => {
      const tree = composeContexts([
        [NumberContext, 1],
        [StringContext, "a"],
      ])("child");

      const outer = tree.props.children;
      expect(outer.type).toBe(NumberContext.Provider);
      expect(outer.props.value).toBe(1);

      const inner = outer.props.children;
      expect(inner.type).toBe(StringContext.Provider);
      expect(inner.props.value).toBe("a");
      expect(inner.props.children).toBe("child");
    });

    it("wraps the result into a fragment", () => {
      expect(composeContexts([[NumberContext, 1]])(null).type).toBe(Fragment);
    });
  });

  describe("children", () => {
    const withNumber = composeContexts([[NumberContext, 5]]);

    it.each([
      ["string", "text", "text"],
      ["number", 10, "10"],
      ["null", null, ""],
      ["undefined", undefined, ""],
      ["boolean", false, ""],
    ])("renders %s children", (_, children, expected) => {
      expect(render(withNumber(children))).toBe(expected);
    });

    it("renders an array of children", () => {
      const html = render(withNumber([<ReadNumber key="a" />, "-", <ReadNumber key="b" />]));

      expect(html).toBe("5-5");
    });

    it("provides values to deeply nested children", () => {
      expect(render(withNumber(<Deep />))).toBe("<div><section>5</section></div>");
    });
  });

  describe("reusability", () => {
    it("can be called several times with different children", () => {
      const compose = composeContexts([[StringContext, "shared"]]);

      expect(render(compose(<ReadString />))).toBe("shared");
      expect(render(compose(<b>static</b>))).toBe("<b>static</b>");
    });

    it("can be nested into another composition", () => {
      const outer = composeContexts([
        [NumberContext, 1],
        [StringContext, "outer"],
      ]);
      const inner = composeContexts([[StringContext, "inner"]]);

      const html = render(
        outer(
          inner(
            <>
              <ReadNumber />|<ReadString />
            </>,
          ),
        ),
      );

      expect(html).toBe("1|inner");
    });

    it("does not mutate the passed list", () => {
      const list = [
        [NumberContext, 1],
        [StringContext, "a"],
      ] as const;
      const snapshot = [...list];

      render(composeContexts(list)(<ReadNumber />));

      expect(list).toEqual(snapshot);
    });

    it("works with a long list of providers", () => {
      const contexts = Array.from({ length: 50 }, (_, index) => createContext(index));
      const Last = contexts[contexts.length - 1]!;
      const ReadLast = () => <>{useContext(Last)}</>;

      const html = render(
        composeContexts(contexts.map((context) => [context, -1] as const))(<ReadLast />),
      );

      expect(html).toBe("-1");
    });
  });
});
