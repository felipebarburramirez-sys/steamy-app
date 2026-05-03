export interface CheapsharkStore {
  storeID: string;
  storeName: string;
  isActive: number | string;
  images: {
    banner: string;
    logo: string;
    icon: string;
  };
}

export interface CheapsharkDeal {
  dealID: string;
  storeID: string;
  gameID: string;
  title: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
  metacriticScore: string;
  steamRatingPercent: string;
  dealRating: string;
  thumb: string;
}

export interface CheapsharkGameLookup {
  info: {
    title: string;
    steamAppID: string | null;
    thumb: string;
  };
  cheapestPriceEver: {
    price: string;
    date: number;
  };
  deals: CheapsharkGameDeal[];
}

export interface CheapsharkGameDeal {
  storeID: string;
  dealID: string;
  price: string;
  retailPrice: string;
  savings: string;
}

export interface StoreSummary {
  id: string;
  name: string;
  logoUrl: string;
  iconUrl: string;
}

export interface DealCard {
  id: string;
  gameId: string;
  title: string;
  salePrice: number;
  normalPrice: number;
  savingsPercent: number;
  dealRating: number;
  metacriticScore: number | null;
  steamRatingPercent: number | null;
  thumb: string;
  store: StoreSummary;
}

export interface FavoriteGame {
  dealId: string;
  gameId: string;
  title: string;
  thumb: string;
  salePrice: number;
  normalPrice: number;
  savingsPercent: number;
  store: StoreSummary;
  savedAt: string;
}

export interface GameOffer {
  dealId: string;
  gameId: string;
  title: string;
  thumb: string;
  salePrice: number;
  normalPrice: number;
  savingsPercent: number;
  store: StoreSummary;
}
