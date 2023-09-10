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
  const contexts = [
    [ThemeContext, theme[Theme.red]],
    [LanguageContext, Languages.cn],
  ] as const;

  return composeContexts<typeof contexts>(
    <div>
      <Children />
      <br />
      ...child elements using contexts
    </div>,
    contexts
  );
}
```

In my proposed variant, the check of context value types works correctly
