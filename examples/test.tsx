import React, { createContext } from "react";
import { composeContexts } from "../lib/composer";

const number = 42;

enum Languages {
  ru = "ru",
  en = "en",
}

const ThemeContext = createContext(number);
const LanguageContext = createContext<Languages>(Languages.en);

const Component = () => {
  const contexts = [
    [ThemeContext, 15],
    [LanguageContext, Languages.en],
  ] as const;

  return composeContexts<typeof contexts>(contexts)(
    <div>
      <div>qweqeqe</div>
      <br />
      ...child elements using contexts
    </div>
  );
};
