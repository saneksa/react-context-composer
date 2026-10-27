import * as React from "react";
import * as ReactDOM from "react-dom";
import * as TestUtils from "react-dom/test-utils";
import type { ReactNode } from "react";

type Root = { render(node: ReactNode): void; unmount(): void };
type ReactDOMClient = { createRoot(container: Element): Root };
type LegacyReactDOM = {
  render(node: ReactNode, container: Element): void;
  unmountComponentAtNode(container: Element): boolean;
};

const majorVersion = Number.parseInt(React.version);

// Tells React 18+ that updates are wrapped in act().
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// React 19 moved act() from react-dom/test-utils to react.
const actImpl: (callback: () => void) => void =
  (React as { act?: (callback: () => void) => void }).act ?? TestUtils.act;

export const act = (callback: () => void) => {
  actImpl(callback);
};

// react-dom/client exists since React 18, React 17 only has the legacy render().
const createRoot = async (container: Element): Promise<Root> => {
  if (majorVersion >= 18) {
    // The specifier is built at runtime so that Vite does not resolve it for React 17.
    const specifier = ["react-dom", "client"].join("/");
    const client: ReactDOMClient = await import(/* @vite-ignore */ specifier);
    return client.createRoot(container);
  }

  const legacy = ReactDOM as unknown as LegacyReactDOM;
  return {
    render: (node) => {
      legacy.render(node, container);
    },
    unmount: () => {
      legacy.unmountComponentAtNode(container);
    },
  };
};

export type Rendered = {
  readonly text: string;
  update(node: ReactNode): void;
  unmount(): void;
};

export const mount = async (node: ReactNode): Promise<Rendered> => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = await createRoot(container);

  act(() => {
    root.render(node);
  });

  return {
    get text() {
      return container.innerHTML;
    },
    update: (next) => {
      act(() => {
        root.render(next);
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
};
