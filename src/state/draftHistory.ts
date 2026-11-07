// Undo and redo inside the avatar wizard: snapshots of the character being made.
import type { Appearance } from '../content/appearance';
import type { TraitId } from '../content/traits';

export interface Draft {
  appearance: Appearance;
  name: string;
  traits: [TraitId, TraitId, TraitId];
}

export class DraftHistory {
  private past: Draft[] = [];
  private future: Draft[] = [];

  record(before: Draft): void {
    this.past.push(structuredClone(before));
    if (this.past.length > 100) this.past.shift();
    this.future = [];
  }

  undo(current: Draft): Draft | null {
    const prev = this.past.pop();
    if (!prev) return null;
    this.future.push(structuredClone(current));
    return prev;
  }

  redo(current: Draft): Draft | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(structuredClone(current));
    return next;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }
}
