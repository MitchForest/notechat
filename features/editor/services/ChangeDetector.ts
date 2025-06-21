import { Transaction } from 'prosemirror-state';
import { Node as ProseMirrorNode } from 'prosemirror-model';

type ChangeType = 'typing' | 'paste' | 'deletion' | 'complex';

interface ParagraphInfo {
  id: string;
  node: ProseMirrorNode;
  text: string;
  pos: number;
}

/**
 * Analyzes a Prosemirror transaction to determine the nature of the change.
 */
export class ChangeDetector {
  /**
   * Detects the type of change based on the transaction's steps.
   * @param transaction The Prosemirror transaction.
   * @returns The type of change detected.
   */
  public detectChangeType(transaction: Transaction): ChangeType {
    const PASTE_THRESHOLD = 50; // More than 50 chars inserted suggests a paste.
    
    let totalInserted = 0;
    let totalDeleted = 0;

    // Analyze the transaction steps to calculate total insertions and deletions.
    transaction.steps.forEach(step => {
      step.getMap().forEach((oldStart, oldEnd, newStart, newEnd) => {
        totalDeleted += oldEnd - oldStart;
        totalInserted += newEnd - newStart;
      });
    });

    // Heuristics to classify the change.
    if (totalInserted > PASTE_THRESHOLD && totalDeleted < PASTE_THRESHOLD / 2) {
      return 'paste';
    }

    if (totalDeleted > 0 && totalInserted > 0) {
      return 'complex'; // e.g., replacing text
    }

    if (totalDeleted > 0) {
      return 'deletion';
    }

    if (totalInserted > 0) {
      return 'typing';
    }

    return 'complex'; // Default for transactions with no clear type (e.g., format changes)
  }

  public getChangedParagraphs(doc: ProseMirrorNode, transaction: Transaction): Map<string, ParagraphInfo> {
    const changedParagraphs = new Map<string, ParagraphInfo>();
    if (!transaction.docChanged) {
      return changedParagraphs;
    }

    if (!transaction.steps || transaction.steps.length === 0) {
      return changedParagraphs;
    }

    transaction.steps.forEach((step: any, index: number) => {
      step.getMap().forEach((oldStart: number, oldEnd: number, newStart: number, newEnd: number) => {
        doc.nodesBetween(newStart, newEnd, (node: ProseMirrorNode, pos: number) => {
          if (node && node.type.name === 'paragraph') {
            const id = `p-${pos}`;
            if (!changedParagraphs.has(id)) {
              changedParagraphs.set(id, {
                id,
                node,
                text: node.textContent,
                pos,
              });
            }
          }
        });
      });
    });
    return changedParagraphs;
  }
} 