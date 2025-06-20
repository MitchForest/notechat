import { TextError } from '../workers/grammar.worker';

export interface RegisteredError extends TextError {
  id: string;
}

/**
 * Manages the state of all text errors in the document.
 */
export class ErrorRegistry {
  // The key is a paragraphId (e.g., `p-123`), and the value is a map of error IDs to error objects.
  private errorsByParagraph: Map<string, Map<string, RegisteredError>> = new Map();

  private generateErrorId(error: TextError): string {
    return `${error.source}:${error.rule}:${error.start}-${error.end}`;
  }

  public updateErrorsForRange(paragraphId: string, errors: TextError[], range: { from: number, to: number }): void {
    const paragraphErrors = this.errorsByParagraph.get(paragraphId) || new Map<string, RegisteredError>();

    // Step 1: Create a set of new error IDs for quick lookup.
    const newErrorIds = new Set(errors.map(e => this.generateErrorId(e)));

    // Step 2: Remove any existing errors within the range that are NOT in the new error list.
    for (const [id, error] of paragraphErrors.entries()) {
      if (error.start >= range.from && error.end <= range.to) {
        if (!newErrorIds.has(id)) {
          paragraphErrors.delete(id);
        }
      }
    }

    // Step 3: Add only the new errors that don't already exist.
    errors.forEach(newError => {
      const id = this.generateErrorId(newError);
      if (!paragraphErrors.has(id)) {
        paragraphErrors.set(id, { ...newError, id });
      }
    });

    this.errorsByParagraph.set(paragraphId, paragraphErrors);
  }

  /**
   * Clears all errors associated with a specific paragraph.
   */
  public clearParagraph(paragraphId: string): void {
    this.errorsByParagraph.delete(paragraphId);
  }

  /**
   * Clears all errors from the registry.
   */
  public clearAll(): void {
    this.errorsByParagraph.clear();
  }

  /**
   * Returns a flat array of all errors currently in the registry.
   */
  public getErrors(): RegisteredError[] {
    const allErrors: RegisteredError[] = [];
    this.errorsByParagraph.forEach(paragraphMap => {
      allErrors.push(...Array.from(paragraphMap.values()));
    });
    return allErrors;
  }

  /**
   * Returns a flat array of all errors for a specific paragraph.
   */
  public getParagraphErrors(paragraphId: string): RegisteredError[] {
    const paragraphErrors = this.errorsByParagraph.get(paragraphId);
    if (!paragraphErrors) {
        return [];
    }
    return Array.from(paragraphErrors.values());
  }

  public getErrorsForParagraph(paragraphId: string): RegisteredError[] {
    const errorsMap = this.errorsByParagraph.get(paragraphId);
    if (!errorsMap) {
        return [];
    }
    return Array.from(errorsMap.values());
  }
} 