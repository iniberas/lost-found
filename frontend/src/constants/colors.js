export const IPB_COLORS = {
  blue: {
    900: "#060A19",
    800: "#111B41",
    700: "#1B2B6A",
    primary: "#263C92",
    500: "#314CBB",
    400: "#4D68D1",
    300: "#768ADB",
    darkBrand: "#0C0B89", 
  },
  yellow: {
    900: "#705E00",
    800: "#A28901",
    700: "#D5B401",
    primary: "#FED80B",
    500: "#FEE03E",
    400: "#FEE871",
    300: "#FFF0A3",
  },
};

export const ADMIN_COLORS = {
  // Global & Text
  background: "#f3f4ff",
  headingText: IPB_COLORS.blue.darkBrand,
  white: "#ffffff",

  // Layout Components
  navbarBg: IPB_COLORS.blue[500],
  sidebarBg: IPB_COLORS.blue.darkBrand,
  sidebarActiveText: IPB_COLORS.blue.darkBrand,

  // Chart Colors
  chartLost: IPB_COLORS.blue.primary,
  chartFound: IPB_COLORS.blue.primary,
  chartGrid: "#d2dbe9",
  chartAxis: "#9ca3af",
};