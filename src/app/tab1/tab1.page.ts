import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, of, switchMap, takeUntil, tap } from 'rxjs';
import { DealCard } from '../core/models/cheapshark.models';
import { FavoriteGameService } from '../core/services/favorite-game.service';
import { GameProviderService } from '../core/services/game-provider.service';
import { DealDetailModalComponent } from '../shared/components/deal-detail-modal/deal-detail-modal.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit, OnDestroy {
  readonly skeletons = Array.from({ length: 6 });

  topDeals: DealCard[] = [];
  searchResults: DealCard[] = [];
  query = '';
  loadingTopDeals = true;
  loadingSearch = false;
  searchActive = false;
  errorMessage = '';
  favoriteGameId: string | null = null;

  private readonly gameProviderService = inject(GameProviderService);
  private readonly favoriteGameService = inject(FavoriteGameService);
  private readonly modalController = inject(ModalController);
  private readonly searchTerms$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadTopDeals();
    this.listenForSearch();
    this.listenForFavorite();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onQueryChange(value: string | null | undefined): void {
    this.searchTerms$.next(value ?? '');
  }

  async toggleFavorite(deal: DealCard): Promise<void> {
    await this.favoriteGameService.toggleFavorite(deal);
  }

  async openDetails(deal: DealCard): Promise<void> {
    const modal = await this.modalController.create({
      component: DealDetailModalComponent,
      componentProps: { deal },
      breakpoints: [0, 0.62, 0.92],
      initialBreakpoint: 0.92,
    });

    await modal.present();
  }

  isFavorite(deal: DealCard): boolean {
    return this.favoriteGameId === deal.gameId;
  }

  trackByDealId(_index: number, deal: DealCard): string {
    return deal.id;
  }

  private loadTopDeals(): void {
    this.loadingTopDeals = true;

    this.gameProviderService.getTopDeals()
      .pipe(
        finalize(() => {
          this.loadingTopDeals = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (deals) => {
          this.topDeals = deals;
          this.errorMessage = '';
        },
        error: () => {
          this.topDeals = [];
          this.errorMessage = 'No se pudieron cargar las ofertas.';
        },
      });
  }

  private listenForSearch(): void {
    this.searchTerms$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        tap((query) => {
          this.query = query;
          this.searchActive = query.trim().length > 0;
          this.loadingSearch = this.searchActive;
        }),
        switchMap((query) => {
          if (!query.trim()) {
            return of([]);
          }

          return this.gameProviderService.searchDeals(query).pipe(
            catchError(() => {
              this.errorMessage = 'No se pudo completar la busqueda.';
              return of([]);
            }),
            finalize(() => {
              this.loadingSearch = false;
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((deals) => {
        this.searchResults = deals;
      });
  }

  private listenForFavorite(): void {
    this.favoriteGameService.favorite$
      .pipe(takeUntil(this.destroy$))
      .subscribe((favorite) => {
        this.favoriteGameId = favorite?.gameId ?? null;
      });
  }

}
