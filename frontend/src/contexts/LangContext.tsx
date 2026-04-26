import { createContext, useContext, useState } from "react";
import { TRANSLATIONS, Lang } from "../i18n/translations";

type T = typeof TRANSLATIONS.en;
interface LangCtx { lang: Lang; setLang: (l: Lang) => void; t: T; }

const Ctx = createContext<LangCtx>({ lang: "en", setLang: () => {}, t: TRANSLATIONS.en });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem("lang") as Lang) ?? "en"
  );

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  return (
    <Ctx.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLang = () => useContext(Ctx);
