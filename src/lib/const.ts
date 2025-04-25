export const valueRegex = /\$\w+|\$\{.*?\}|:\w+|\?|NULL\b|NOT\s+NULL\b/i;
export const identifierRegex = /[()]|\$\{.*?\}|:\w+::|\?\?|\$\w+|:\w+:|"[^"]*"/;
export const placeholderRegex = /(?<![\w.@])(['"]?)(@{1,3})(\w+)\1(?![\w.@])/g;
