import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { ModalController } from '@ionic/angular';
import { Subject, finalize, takeUntil } from 'rxjs';
import { DealCard, GameOffer } from '../../../core/models/cheapshark.models';
import { FavoriteGameService } from '../../../core/services/favorite-game.service';
import { GameProviderService } from '../../../core/services/game-provider.service';

@Component({
  selector: 'app-deal-detail-modal',
  templateUrl: './deal-detail-modal.component.html',
  styleUrls: ['./deal-detail-modal.component.scss'],
  standalone: false,
})
export class DealDetailModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) deal!: DealCard;

  offers: GameOffer[] = [];
  loadingOffers = false;
  favorite = false;

  private readonly modalController = inject(ModalController);
  private readonly gameProviderService = inject(GameProviderService);
  private readonly favoriteGameService = inject(FavoriteGameService);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.favoriteGameService.favorite$
      .pipe(takeUntil(this.destroy$))
      .subscribe((favorite) => {
        this.favorite = favorite?.gameId === this.deal.gameId;
      });

    this.loadOffers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async close(): Promise<void> {
    await this.modalController.dismiss();
  }

  async toggleFavorite(): Promise<void> {
    await this.favoriteGameService.toggleFavorite(this.deal);
  }

  async openDeal(dealId = this.deal.id): Promise<void> {
    await Browser.open({ url: this.gameProviderService.getRedirectUrl(dealId) });
  }

  private loadOffers(): void {
    this.loadingOffers = true;

    this.gameProviderService.getGameOffers(this.deal.gameId)
      .pipe(
        finalize(() => {
          this.loadingOffers = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (offers) => {
          this.offers = offers.slice(0, 8);
        },
        error: () => {
          this.offers = [];
        },
      });
  }
}
