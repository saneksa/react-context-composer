[![NPM](https://img.shields.io/npm/v/@saneksa/react-context-composer?style=plastic&color=red)](https://npmjs.com/package/@saneksa/react-context-composer/) [![GitHub license](https://img.shields.io/npm/l/@saneksa/react-context-composer?style=plastic)](https://github.com/saneksa/react-context-composer/blob/main/LICENSE) [![CI](https://img.shields.io/github/actions/workflow/status/saneksa/react-context-composer/ci.yml?branch=main&style=plastic&label=CI)](https://github.com/saneksa/react-context-composer/actions/workflows/ci.yml)

### Installation

```sh
yarn add @saneksa/react-context-composer
```

## The Problem

In projects on react there are a lot of contexts, it becomes very difficult to read such things

```jsx
<ContextA.Provider>
  <ContextB.Provider>
    <ContextC.Provider>...</ContextC.Provider>
  </ContextB.Provider>
</ContextA.Provider>
```

## Usage

See it in action at [codesandbox](https://codesandbox.io/p/sandbox/nostalgic-platform-z7dsrt)

```jsx
function App() {
  return composeContexts([
    [ThemeContext, theme[Theme.red]],
    [LanguageContext, Languages.cn],
  ])(
    <div>
      <Children />
      <br />
      ...child elements using contexts
    </div>,
  );
}
```

In my proposed variant, the check of context value types works correctly
