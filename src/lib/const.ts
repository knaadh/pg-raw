export const valueRegex = /\$\w+|\$\{.*?\}|:\w+|\?|NULL\b|NOT\s+NULL\b/i;
export const identifierRegex = /[()]|\$\{.*?\}|:\w+::|\?\?|\$\w+|:\w+:/;
export const placeholderRegex = /(?<![\w.@])(['"]?)(@@?)(\w+)\1(?![\w.@])/g;
