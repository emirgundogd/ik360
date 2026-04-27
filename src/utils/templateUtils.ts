export const applyTemplateVariables = (
  template: string,
  variables: Record<string, string | number>
): string => {
  let text = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    text = text.replace(regex, String(value));
  });
  return text;
};
