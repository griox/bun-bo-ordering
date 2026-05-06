/* eslint-disable @typescript-eslint/no-explicit-any */
export const getErrorMessage = (err: any): string | null => {
  const data = err.response?.data;
  
  if (!data) return null;

  // 1. Handle validation errors (FluentValidation or .NET default)
  if (data.errors) {
    const firstErrorKey = Object.keys(data.errors)[0];
    const errors = data.errors[firstErrorKey];
    return Array.isArray(errors) ? errors[0] : errors;
  }

  // 2. Handle ProblemDetails (detail field) or Legacy errors (message field)
  return data.detail || data.message || (typeof data === 'string' ? data : null);
};
