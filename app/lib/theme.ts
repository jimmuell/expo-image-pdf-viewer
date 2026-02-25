import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance, ColorSchemeName } from "react-native";

export type ThemePreference = "light" | "dark" | "system";

export const LIGHT = {
  bg:       "#F2F3F7",
  card:     "#FFFFFF",
  border:   "#E0E2EA",
  hairline: "#E5E5EA",
  text:     "#1A1F2E",
  subtext:  "#3C3C43",
  muted:    "#8A8F9D",
};

export const DARK = {
  bg:       "#0D1B2E",  // deep navy (darker than brand navy)
  card:     "#16243A",  // slightly lighter navy for card surfaces
  border:   "#1F3350",  // navy border
  hairline: "#1A2D47",  // hairline dividers
  text:     "#F0F2F5",  // near-white
  subtext:  "#C8CDD6",  // light secondary text
  muted:    "#7B8699",  // muted blue-grey
};

export type ThemeColors = typeof LIGHT;

type ThemeCtx = {
  preference: ThemePreference;
  isDark: boolean;
  colors: ThemeColors;
  setPreference: (p: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeCtx>({
  preference: "system",
  isDark: false,
  colors: LIGHT,
  setPreference: () => {},
});

const STORAGE_KEY = "theme_preference";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((val) => {
        if (val === "light" || val === "dark" || val === "system") {
          setPreferenceState(val);
        }
      })
      .catch(() => {});
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const setPreference = (p: ThemePreference) => {
    setPreferenceState(p);
    SecureStore.setItemAsync(STORAGE_KEY, p).catch(() => {});
  };

  const isDark =
    preference === "dark" ||
    (preference === "system" && systemScheme === "dark");

  const colors = isDark ? DARK : LIGHT;

  return React.createElement(
    ThemeContext.Provider,
    { value: { preference, isDark, colors, setPreference } },
    children
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
