import { Component, OnInit, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  closeOutline,
  gameControllerOutline,
  heart,
  heartOutline,
  openOutline,
  pricetagOutline,
  searchOutline,
  trashOutline,
} from 'ionicons/icons';
import { FavoriteGameService } from './core/services/favorite-game.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private readonly favoriteGameService = inject(FavoriteGameService);

  constructor() {
    addIcons({
      'alert-circle-outline': alertCircleOutline,
      'close-outline': closeOutline,
      'game-controller-outline': gameControllerOutline,
      heart,
      'heart-outline': heartOutline,
      'open-outline': openOutline,
      'pricetag-outline': pricetagOutline,
      'search-outline': searchOutline,
      'trash-outline': trashOutline,
    });
  }

  ngOnInit(): void {
    void this.favoriteGameService.init();
  }
}
