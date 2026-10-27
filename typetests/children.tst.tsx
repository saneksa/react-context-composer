import { createContext } from "react";
import { describe, test } from "tstyche";
import { composeContexts } from "../lib";

// Not checked with @types/react 17: it declares ReactFragment as `{} | Iterable<ReactNode>`,
// so any object is a valid ReactNode there.
describe("children", () => {
  test("rejects plain objects", () => {
    const compose = composeContexts([[createContext(0), 1]]);

    // @ts-expect-error Object literal may only specify known properties, and 'notANode' does not exist
    compose({ notANode: true });
  });
});
