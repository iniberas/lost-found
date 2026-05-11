export function buildParams(obj) {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) params.append(k, String(v));
  });
  return params.toString();
}