import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';
import { DealCard, FavoriteGame } from '../models/cheapshark.models';

@Injectable({
  providedIn: 'root',
})
export class FavoriteGameService {
  private readonly storageKey = 'favoriteGame';
  private readonly favoriteSubject = new BehaviorSubject<FavoriteGame | null>(null);

  readonly favorite$ = this.favoriteSubject.asObservable();

  async init(): Promise<void> {
    const stored = await Preferences.get({ key: this.storageKey });

    if (!stored.value) {
      this.favoriteSubject.next(null);
      return;
    }

    try {
      this.favoriteSubject.next(JSON.parse(stored.value) as FavoriteGame);
    } catch {
      await this.clearFavorite();
    }
  }

  getSnapshot(): FavoriteGame | null {
    return this.favoriteSubject.value;
  }

  isFavorite(gameId: string): boolean {
    return this.favoriteSubject.value?.gameId === gameId;
  }

  async setFavorite(deal: DealCard): Promise<void> {
    const favorite: FavoriteGame = {
      dealId: deal.id,
      gameId: deal.gameId,
      title: deal.title,
      thumb: deal.thumb,
      salePrice: deal.salePrice,
      normalPrice: deal.normalPrice,
      savingsPercent: deal.savingsPercent,
      store: deal.store,
      savedAt: new Date().toISOString(),
    };

    await Preferences.set({
      key: this.storageKey,
      value: JSON.stringify(favorite),
    });

    this.favoriteSubject.next(favorite);
  }

  async toggleFavorite(deal: DealCard): Promise<void> {
    if (this.isFavorite(deal.gameId)) {
      await this.clearFavorite();
      return;
    }

    await this.setFavorite(deal);
  }

  async clearFavorite(): Promise<void> {
    await Preferences.remove({ key: this.storageKey });
    this.favoriteSubject.next(null);
  }
}
