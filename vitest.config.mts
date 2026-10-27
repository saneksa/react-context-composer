import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const reactVersion = process.env.REACT_VERSION;

const compatAliases = (version: string) => {
  const modules = fileURLToPath(new URL(`./compat/react${version}/node_modules/`, import.meta.url));

  return [
    { find: /^react$/, replacement: `${modules}react/index.js` },
    { find: /^react\/(.*)$/, replacement: `${modules}react/$1.js` },
    { find: /^react-dom$/, replacement: `${modules}react-dom/index.js` },
    { find: /^react-dom\/(.*)$/, replacement: `${modules}react-dom/$1.js` },
  ];
};

export default defineConfig({
  resolve: {
    alias: reactVersion ? compatAliases(reactVersion) : [],
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "happy-dom",
    server: {
      deps: {
        inline: reactVersion ? [/compat\/react/] : [],
      },
    },
  },
});
