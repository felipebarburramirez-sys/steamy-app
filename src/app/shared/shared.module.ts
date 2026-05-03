import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DealCardComponent } from './components/deal-card/deal-card.component';
import { DealDetailModalComponent } from './components/deal-detail-modal/deal-detail-modal.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';

@NgModule({
  declarations: [
    DealCardComponent,
    DealDetailModalComponent,
    EmptyStateComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
  ],
  exports: [
    DealCardComponent,
    DealDetailModalComponent,
    EmptyStateComponent,
  ],
})
export class SharedModule {}
