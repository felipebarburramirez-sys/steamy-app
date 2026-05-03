import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { Subject, finalize, takeUntil } from 'rxjs';
import { FavoriteGame, GameOffer } from '../core/models/cheapshark.models';
import { FavoriteGameService } from '../core/services/favorite-game.service';
import { GameProviderService } from '../core/services/game-provider.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit, OnDestroy {
  favorite: FavoriteGame | null = null;
  offers: GameOffer[] = [];
  loadingOffers = false;
  errorMessage = '';

  private readonly favoriteGameService = inject(FavoriteGameService);
  private readonly gameProviderService = inject(GameProviderService);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.favoriteGameService.favorite$
      .pipe(takeUntil(this.destroy$))
      .subscribe((favorite) => {
        this.favorite = favorite;

        if (!favorite) {
          this.offers = [];
          this.errorMessage = '';
          return;
        }

        this.loadOffers(favorite.gameId);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async openDeal(dealId: string): Promise<void> {
    await Browser.open({ url: this.gameProviderService.getRedirectUrl(dealId) });
  }

  async clearFavorite(): Promise<void> {
    await this.favoriteGameService.clearFavorite();
  }

  trackByOfferId(_index: number, offer: GameOffer): string {
    return offer.dealId;
  }

  private loadOffers(gameId: string): void {
    this.loadingOffers = true;

    this.gameProviderService.getGameOffers(gameId)
      .pipe(
        finalize(() => {
          this.loadingOffers = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (offers) => {
          this.offers = offers;
          this.errorMessage = '';
        },
        error: () => {
          this.offers = [];
          this.errorMessage = 'No se pudieron cargar las ofertas del favorito.';
        },
      });
  }

}
