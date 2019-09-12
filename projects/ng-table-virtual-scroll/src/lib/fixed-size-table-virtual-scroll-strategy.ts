import { Injectable } from '@angular/core';
import { distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CdkVirtualScrollViewport, VirtualScrollStrategy } from '@angular/cdk/scrolling';
import { ListRange } from '@angular/cdk/collections';

@Injectable()
export class FixedSizeTableVirtualScrollStrategy implements VirtualScrollStrategy {
  private rowHeight!: number;
  private headerHeight!: number;
  private bufferMultiplier!: number;
  private indexChange = new Subject<number>();


  public viewport: CdkVirtualScrollViewport;

  public renderedRangeStream = new Subject<ListRange>();

  public scrolledIndexChange = this.indexChange.pipe(distinctUntilChanged());

  get dataLength(): number {
    return this._dataLength;
  }

  set dataLength(value: number) {
    this._dataLength = value;
    this.onDataLengthChanged();
  }

  private _dataLength = 0;

  public attach(viewport: CdkVirtualScrollViewport): void {
    this.viewport = viewport;
    this.viewport.renderedRangeStream.subscribe(this.renderedRangeStream);
    this.onDataLengthChanged();
    this.updateContent();
  }

  public detach(): void {
    // no-op
  }

  public onContentScrolled(): void {
    this.updateContent();
  }

  public onDataLengthChanged(): void {
    if (this.viewport) {
      this.viewport.setTotalContentSize(this.dataLength * this.rowHeight + this.headerHeight);
    }
  }

  public onContentRendered(): void {
    // no-op
  }

  public onRenderedOffsetChanged(): void {
    // no-op
  }

  public scrollToIndex(index: number, behavior: ScrollBehavior): void {
    // no-op
  }

  public setConfig({rowHeight, headerHeight, bufferMultiplier}: { rowHeight: number, headerHeight: number, bufferMultiplier: number }) {
    if (this.rowHeight === rowHeight || this.headerHeight === headerHeight || this.bufferMultiplier === bufferMultiplier) {
      return;
    }
    this.rowHeight = rowHeight;
    this.headerHeight = headerHeight;
    this.bufferMultiplier = bufferMultiplier;
    this.updateContent();
  }

  private updateContent() {
    if (!this.viewport || !this.rowHeight) {
      return;
    }

    const amount = Math.ceil(this.viewport.getViewportSize() / this.rowHeight);
    const offset = Math.max(this.viewport.measureScrollOffset() - this.headerHeight, 0);
    const buffer = Math.ceil(amount * this.bufferMultiplier);

    const skip = Math.round(offset / this.rowHeight);
    const index = Math.max(0, skip);
    const start = Math.max(0, index - buffer);
    const end = Math.min(this.dataLength, index + amount + buffer);
    this.viewport.setRenderedContentOffset(this.rowHeight * start);
    this.viewport.setRenderedRange({start, end});
    this.indexChange.next(index);
  }
}
