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
  return composeContexts([
    [ThemeContext, 15],
    [LanguageContext, Languages.en],
  ])(
    <div>
      <div>qweqeqe</div>
      <br />
      ...child elements using contexts
    </div>
  );
};
