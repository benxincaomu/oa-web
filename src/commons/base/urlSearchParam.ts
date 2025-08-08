function formToUrlParams(formData: Record<string, string | number | boolean>): string {
  const params = new URLSearchParams();
  
  Object.entries(formData).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
}
export default formToUrlParams;