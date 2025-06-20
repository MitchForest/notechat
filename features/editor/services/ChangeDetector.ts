import { Transaction } from 'prosemirror-state';

type ChangeType = 'typing' | 'paste' | 'deletion' | 'complex';

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
} 