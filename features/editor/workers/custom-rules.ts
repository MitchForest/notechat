import { visit } from "unist-util-visit"
import { toString } from "nlcst-to-string"
import type { VFile } from "vfile"
import type { Node } from "unist"

interface CustomCapitalizationOptions {
  properNouns?: string[];
}

const DEFAULT_PROPER_NOUNS = ['Mitchell', 'Tiptap', 'ProseMirror', 'JavaScript', 'TypeScript'];

export const customCapitalizationRule = (options: CustomCapitalizationOptions = {}) => {
  const properNouns = options.properNouns || DEFAULT_PROPER_NOUNS;
  const properNounsLower = properNouns.map(name => name.toLowerCase());

  return (tree: Node, file: VFile) => {
    // Check for sentence capitalization
    visit(tree, 'SentenceNode', (sentence: any) => {
      // Find the first word, skipping any leading whitespace or punctuation
      const firstWord = sentence.children.find(
        (child: any) => child.type === 'WordNode'
      );
      
      if (firstWord) {
        const text = toString(firstWord);
        if (text && /^[a-z]/.test(text)) {
          const message = file.message(
            `Sentence should start with a capital letter`,
            firstWord
          );
          message.source = 'custom-capitalization';
          message.ruleId = 'sentence-start';
          message.actual = text;
          message.expected = [text[0].toUpperCase() + text.slice(1)];
        }
      }
    });
    
    // Check for "i" and proper nouns
    visit(tree, 'WordNode', (word: any) => {
      const text = toString(word);

      // Check for uncapitalized "i"
      if (text === 'i') {
        const message = file.message(
          `"i" should be capitalized`,
          word
        );
        message.source = 'custom-capitalization';
        message.ruleId = 'personal-pronoun';
        message.actual = 'i';
        message.expected = ['I'];
      }

      // Check for proper nouns
      const lowerWordValue = text.toLowerCase();
      const properNounIndex = properNounsLower.indexOf(lowerWordValue);

      if (properNounIndex !== -1 && text !== properNouns[properNounIndex]) {
        const suggestion = properNouns[properNounIndex];
        const message = file.message(
          `The proper noun "${suggestion}" should be capitalized.`,
          word,
        );
        message.source = 'custom-capitalization';
        message.ruleId = 'proper-noun';
        message.expected = [suggestion];
        message.actual = text;
      }
    });
  };
};

export const customContractionsRule = () => {
  const incorrectContractions: Record<string, string> = {
    "cant": "can't", "wont": "won't", "dont": "don't", "isnt": "isn't",
    "arent": "aren't", "wasnt": "wasn't", "werent": "weren't", "im": "i'm",
    "youre": "you're", "hes": "he's", "shes": "she's", "theyre": "they're",
    "its": "it's" // Special case, handled below
  };
  
  return (tree: any, file: VFile) => {
    visit(tree, 'WordNode', (word: any, index?: number, parent?: any) => {
      if (index === undefined || !parent) return;

      const originalText = toString(word);
      // Strip trailing punctuation for the check to handle cases like "cant."
      const lowerText = originalText.toLowerCase().replace(/[.,!?]$/, '');

      if (incorrectContractions[lowerText]) {
        // The "its" vs "it's" logic is complex. For now, we will flag all instances
        // of "its" and suggest "it's", as it's a very common error.
        
        const message = file.message(
          `Incorrect or missing apostrophe in contraction`,
          word
        );
        message.source = 'custom-contractions';
        message.ruleId = 'missing-apostrophe';
        message.actual = originalText;
        message.expected = [incorrectContractions[lowerText]];
      }
    });
  };
}; 