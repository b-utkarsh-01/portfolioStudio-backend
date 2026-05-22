export const parseCookies = (cookieHeader = "") =>
  cookieHeader
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const index = pair.indexOf("=");
      if (index < 0) return acc;
      const key = pair.slice(0, index).trim();
      const value = decodeURIComponent(pair.slice(index + 1).trim());
      if (key) acc[key] = value;
      return acc;
    }, {});
