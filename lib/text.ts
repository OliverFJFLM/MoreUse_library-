const normalise = (text: string): string =>
  text
    .toLowerCase()
    .replace(/【[^】]+】/g, ' ')
    .replace(/[\p{P}\p{S}]+/gu, ' ');

const tokenize = (text: string): string[] => {
  const tokens = new Set<string>();
  const normalised = normalise(text);
  const words = normalised.split(/\s+/).map((token) => token.trim()).filter(Boolean);

  for (const word of words) {
    tokens.add(word);
    if (word.length > 1) {
      for (let index = 0; index < word.length; index += 1) {
        tokens.add(word[index]);
        if (index < word.length - 1) {
          tokens.add(word.slice(index, index + 2));
        }
      }
    }
  }

  if (!words.length) {
    for (const char of normalised.replace(/\s+/g, '')) {
      tokens.add(char);
    }
  }

  return Array.from(tokens).filter(Boolean);
};

export const similarity = (a: string, b: string): number => {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));

  if (tokensA.size === 0 || tokensB.size === 0) {
    return 0;
  }

  let intersection = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) {
      intersection += 1;
    }
  });

  const union = new Set([...tokensA, ...tokensB]).size;

  return union === 0 ? 0 : intersection / union;
};

export const concatText = (...parts: Array<string | undefined | null>): string =>
  parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ');
