import { Component, ChangeDetectionStrategy, input, output, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomEntity, TabState } from '../../../shared/model/social/social-scan.models';
import { SocialScanService } from '../social-scan.service';
import { GraphOrchestratorService } from '../graph-orchestrator.service';
import { EntityMenuComponent } from '../entity-menu/entity-menu.component';
import { AddEntityModalComponent, AddEntityData } from '../components/add-entity-modal/add-entity-modal.component';

@Component({
  selector: 'app-entity-manager',
  standalone: true,
  imports: [CommonModule, EntityMenuComponent, AddEntityModalComponent],
  templateUrl: './entity-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityManagerComponent {
  isCollapsed = input.required<boolean>();
  activeTabState = input.required<TabState>();

  toggle = output<void>();

  private scanService = inject(SocialScanService);
  private graphOrchestrator = inject(GraphOrchestratorService);
  private destroyRef = inject(DestroyRef);

  addEntityModalData = signal<AddEntityData | null>(null);

  openAddEntityModal(type: CustomEntity['type']) {
    this.addEntityModalData.set({ type, value: '' });
  }

  closeAddEntityModal() {
    this.addEntityModalData.set(null);
  }

  confirmAddEntity(entityData: AddEntityData) {
    const { type, value } = entityData;
    const label = value.trim();
    if (!label) {
        this.closeAddEntityModal();
        return;
    }
    const tempId = `pending-${self.crypto.randomUUID()}`;
    const pendingEntity: CustomEntity = { id: tempId, type, label, value, onGraph: false, status: 'pending' };

    const state = this.activeTabState();
    state.customEntities.update(entities => [pendingEntity, ...entities]);
    state.activeHomeMenuTab.set('entities');
    this.closeAddEntityModal();

    this.scanService.addEntity({ type, label, value }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newEntity: CustomEntity) => state.customEntities.update(e => e.map(entity => entity.id === tempId ? newEntity : entity)),
        error: (err) => {
          state.customEntities.update(e => e.filter(entity => entity.id !== tempId));
        }
      });
  }

  public addEntityToGraph(entityId: string) {
    this.graphOrchestrator.addEntityToGraph(this.activeTabState(), entityId);
  }

  public deleteCustomEntity(nodeId: string) {
    this.graphOrchestrator.deleteCustomEntity(this.activeTabState(), nodeId);
  }
}
