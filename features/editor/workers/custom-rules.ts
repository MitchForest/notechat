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
  const contractions: Record<string, string> = {
    "cant": "can't", "wont": "won't", "dont": "don't", "isnt": "isn't",
    "arent": "aren't", "wasnt": "wasn't", "werent": "weren't", "its": "it's"
  };
  
  return (tree: any, file: VFile) => {
    visit(tree, 'WordNode', (word: any) => {
      const text = toString(word).toLowerCase();
      if (contractions[text]) {
        if (text === 'its') {
            const nextNode = word.parent?.children[word.parent.children.indexOf(word) + 2];
            if (nextNode && nextNode.type === 'WordNode') {
                const nextWord = toString(nextNode).toLowerCase();
                if (['a', 'an', 'the', 'is', 'was', 'has', 'been'].indexOf(nextWord) === -1) {
                    return;
                }
            }
        }

        const message = file.message(
          `Missing apostrophe in contraction`,
          word
        );
        message.source = 'custom-contractions';
        message.ruleId = 'missing-apostrophe';
        message.actual = text;
        message.expected = [contractions[text]];
      }
    });
  };
}; 