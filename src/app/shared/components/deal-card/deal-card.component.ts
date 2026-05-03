import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { DealCard } from '../../../core/models/cheapshark.models';

@Component({
  selector: 'app-deal-card',
  templateUrl: './deal-card.component.html',
  styleUrls: ['./deal-card.component.scss'],
  standalone: false,
})
export class DealCardComponent implements OnChanges {
  @Input({ required: true }) deal!: DealCard;
  @Input() favorite = false;
  @Input() compact = false;

  @Output() readonly selectDeal = new EventEmitter<void>();
  @Output() readonly favoriteToggle = new EventEmitter<void>();

  imageFailed = false;

  ngOnChanges(): void {
    this.imageFailed = false;
  }

  onFavoriteClick(event: Event): void {
    event.stopPropagation();
    this.favoriteToggle.emit();
  }
}
