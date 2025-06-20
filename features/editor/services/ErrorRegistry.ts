import { TextError } from '../workers/grammar.worker';

type ErrorStatus = 'tentative' | 'confirmed';

interface RegisteredError extends TextError {
  id: string;
  status: ErrorStatus;
  priority: number;
}

/**
 * Manages the state of all text errors in the document, including their
 * confirmation status.
 */
export class ErrorRegistry {
  // The key is a paragraphId (e.g., `p-123`), and the value is a map of error IDs to error objects.
  private errorsByParagraph: Map<string, Map<string, RegisteredError>> = new Map();

  private generateErrorId(error: TextError): string {
    return `${error.source}:${error.rule}:${error.start}-${error.end}`;
  }

  private calculatePriority(error: TextError, status: ErrorStatus): number {
    if (status === 'tentative') {
      return 1; // Lowest priority for instant checks
    }
    // For confirmed errors, prioritize spelling over grammar/style.
    const isSpelling = error.source.includes('spell');
    return isSpelling ? 3 : 2;
  }

  private getOverlappingErrors(error: TextError, paragraphId: string): RegisteredError[] {
    const paragraphErrors = this.errorsByParagraph.get(paragraphId);
    if (!paragraphErrors) return [];

    const overlapping: RegisteredError[] = [];
    for (const existingError of paragraphErrors.values()) {
      // Simple overlap check: (StartA <= EndB) and (EndA >= StartB)
      if (error.start <= existingError.end && error.end >= existingError.start) {
        overlapping.push(existingError);
      }
    }
    return overlapping;
  }

  public updateErrorsForRange(paragraphId: string, errors: TextError[], range: { from: number, to: number }): void {
    const paragraphErrors = this.errorsByParagraph.get(paragraphId) || new Map<string, RegisteredError>();

    // Remove any existing errors that are fully contained within the new check's range.
    for (const [id, error] of paragraphErrors.entries()) {
      if (error.start >= range.from && error.end <= range.to) {
        paragraphErrors.delete(id);
      }
    }

    // Add the new errors.
    errors.forEach(newError => {
      const id = this.generateErrorId(newError);
      const priority = this.calculatePriority(newError, 'confirmed');
      paragraphErrors.set(id, { ...newError, id, status: 'confirmed', priority });
    });

    this.errorsByParagraph.set(paragraphId, paragraphErrors);
  }

  /**
   * Adds a list of tentative errors to the registry.
   * Tentative errors are typically from a faster, less accurate checker
   */
  public addTentative(paragraphId: string, errors: TextError[]): string[] {
    const newErrorIds: string[] = [];
    const paragraphErrors = this.errorsByParagraph.get(paragraphId) || new Map<string, RegisteredError>();

    errors.forEach(error => {
      const overlapping = this.getOverlappingErrors(error, paragraphId);
      
      // Do not add a tentative error if a confirmed one already exists in the same spot.
      if (overlapping.some(e => e.status === 'confirmed')) {
        return; // continue to next error
      }

      const id = this.generateErrorId(error);
      const priority = this.calculatePriority(error, 'tentative');
      paragraphErrors.set(id, { ...error, id, status: 'tentative', priority });
      newErrorIds.push(id);
    });

    this.errorsByParagraph.set(paragraphId, paragraphErrors);
    return newErrorIds;
  }

  /**
   * Upgrades a tentative error to confirmed status.
   */
  public confirmError(errorId: string, paragraphId: string): void {
    const paragraphErrors = this.errorsByParagraph.get(paragraphId);
    if (paragraphErrors && paragraphErrors.has(errorId)) {
      const error = paragraphErrors.get(errorId)!;
      error.status = 'confirmed';
    }
  }

  /**
   * Removes a single error from the registry by its ID.
   */
  public removeError(errorId: string, paragraphId: string): void {
    const paragraphErrors = this.errorsByParagraph.get(paragraphId);
    if (paragraphErrors) {
      paragraphErrors.delete(errorId);
      if (paragraphErrors.size === 0) {
        this.errorsByParagraph.delete(paragraphId);
      }
    }
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