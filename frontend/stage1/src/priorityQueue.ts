/**
 * MinHeap-based Priority Queue for ScoredNotification.
 *
 * We use a MIN-heap of size K (default 10).
 * Invariant: the root always holds the LOWEST-scored item in our top-K set.
 * When a new notification arrives:
 *   - If heap.size < K  → push unconditionally.
 *   - Else if newScore > root.score → replace root and sift-down (O(log K)).
 *   - Else discard (O(1)).
 *
 * Final top-K is obtained by draining the heap and reversing (highest first).
 * All heap operations are O(log K) — far cheaper than re-sorting the full
 * notification list on every insertion.
 */

import { ScoredNotification } from "./types";

export class MinHeap {
  private heap: ScoredNotification[] = [];
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get size(): number {
    return this.heap.length;
  }

  peek(): ScoredNotification | undefined {
    return this.heap[0];
  }

  push(item: ScoredNotification): void {
    if (this.heap.length < this.capacity) {
      this.heap.push(item);
      this.bubbleUp(this.heap.length - 1);
    } else if (item.score > this.heap[0].score) {
      this.heap[0] = item;
      this.siftDown(0);
    }
    // else: item cannot improve the top-K, discard O(1)
  }

  /** Drain and return all items sorted highest-score first. */
  drainSorted(): ScoredNotification[] {
    const result: ScoredNotification[] = [];
    // Extract-min K times → ascending order → reverse for descending
    const copy = [...this.heap];
    const tmpHeap = new MinHeap(this.capacity);
    tmpHeap.heap = copy;

    while (tmpHeap.heap.length > 0) {
      result.push(tmpHeap.heap[0]);
      tmpHeap.heap[0] = tmpHeap.heap[tmpHeap.heap.length - 1];
      tmpHeap.heap.pop();
      if (tmpHeap.heap.length > 0) tmpHeap.siftDown(0);
    }

    result.reverse(); // highest score first
    return result;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[parent].score <= this.heap[i].score) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  private siftDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.heap[l].score < this.heap[smallest].score) smallest = l;
      if (r < n && this.heap[r].score < this.heap[smallest].score) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}
