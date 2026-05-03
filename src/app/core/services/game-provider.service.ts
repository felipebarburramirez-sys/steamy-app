import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, shareReplay } from 'rxjs';
import {
  CheapsharkDeal,
  CheapsharkGameLookup,
  CheapsharkStore,
  DealCard,
  GameOffer,
  StoreSummary,
} from '../models/cheapshark.models';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root',
})
export class GameProviderService {
  private readonly httpService = inject(HttpService);
  private stores$?: Observable<Map<string, StoreSummary>>;

  getTopDeals(pageSize = 5): Observable<DealCard[]> {
    return forkJoin({
      deals: this.httpService.get<CheapsharkDeal[]>('/deals', { pageSize }),
      stores: this.getStoresMap(),
    }).pipe(
      map(({ deals, stores }) => deals.map((deal) => this.toDealCard(deal, stores))),
    );
  }

  searchDeals(query: string): Observable<DealCard[]> {
    const title = query.trim();

    if (!title) {
      return of([]);
    }

    return forkJoin({
      deals: this.httpService.get<CheapsharkDeal[]>('/deals', { title }),
      stores: this.getStoresMap(),
    }).pipe(
      map(({ deals, stores }) => deals.map((deal) => this.toDealCard(deal, stores))),
    );
  }

  getGameOffers(gameId: string): Observable<GameOffer[]> {
    return forkJoin({
      game: this.httpService.get<CheapsharkGameLookup>('/games', { id: gameId }),
      stores: this.getStoresMap(),
    }).pipe(
      map(({ game, stores }) =>
        game.deals.map((deal) => ({
          dealId: deal.dealID,
          gameId,
          title: game.info.title,
          thumb: game.info.thumb,
          salePrice: this.toNumber(deal.price),
          normalPrice: this.toNumber(deal.retailPrice),
          savingsPercent: this.toNumber(deal.savings),
          store: this.findStore(stores, deal.storeID),
        })),
      ),
    );
  }

  getRedirectUrl(dealId: string): string {
    return `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(dealId)}`;
  }

  private getStoresMap(): Observable<Map<string, StoreSummary>> {
    if (!this.stores$) {
      this.stores$ = this.httpService.get<CheapsharkStore[]>('/stores').pipe(
        map((stores) => {
          const storeMap = new Map<string, StoreSummary>();

          stores.forEach((store) => {
            storeMap.set(store.storeID, {
              id: store.storeID,
              name: store.storeName,
              logoUrl: this.normalizeAssetUrl(store.images.logo),
              iconUrl: this.normalizeAssetUrl(store.images.icon),
            });
          });

          return storeMap;
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    }

    return this.stores$;
  }

  private toDealCard(deal: CheapsharkDeal, stores: Map<string, StoreSummary>): DealCard {
    return {
      id: deal.dealID,
      gameId: deal.gameID,
      title: deal.title,
      salePrice: this.toNumber(deal.salePrice),
      normalPrice: this.toNumber(deal.normalPrice),
      savingsPercent: this.toNumber(deal.savings),
      dealRating: this.toNumber(deal.dealRating),
      metacriticScore: this.toNullableNumber(deal.metacriticScore),
      steamRatingPercent: this.toNullableNumber(deal.steamRatingPercent),
      thumb: deal.thumb,
      store: this.findStore(stores, deal.storeID),
    };
  }

  private findStore(stores: Map<string, StoreSummary>, storeId: string): StoreSummary {
    return stores.get(storeId) ?? {
      id: storeId,
      name: 'Unknown store',
      logoUrl: '',
      iconUrl: '',
    };
  }

  private normalizeAssetUrl(path: string): string {
    if (!path) {
      return '';
    }

    if (path.startsWith('http')) {
      return path;
    }

    if (path.startsWith('//')) {
      return `https:${path}`;
    }

    return `https://www.cheapshark.com${path}`;
  }

  private toNullableNumber(value: string): number | null {
    const parsed = Number(value);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private toNumber(value: string): number {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }
}
