import { ApplicationRef, ComponentRef, EnvironmentInjector, Type, createComponent } from '@angular/core';
import { RenderedLeafletComponent } from '../../models/geo-fencing.models';

export class LeafletComponentRenderer {
  private refs = new Set<ComponentRef<any>>();

  constructor(private appRef: ApplicationRef, private environmentInjector: EnvironmentInjector) {}

  create<T>(component: Type<T>, inputs: Partial<T>): RenderedLeafletComponent<T> {
    const componentRef = createComponent(component, {
      environmentInjector: this.environmentInjector,
    });

    Object.assign(componentRef.instance as object, inputs);
    this.appRef.attachView(componentRef.hostView);
    componentRef.changeDetectorRef.detectChanges();
    this.refs.add(componentRef);

    return {
      element: componentRef.location.nativeElement as HTMLElement,
      componentRef,
    };
  }

  destroy<T>(componentRef: ComponentRef<T> | null | undefined): void {
    if (!componentRef) {
      return;
    }
    this.refs.delete(componentRef);
    this.appRef.detachView(componentRef.hostView);
    componentRef.destroy();
  }

  destroyAll(): void {
    Array.from(this.refs).forEach((componentRef) => this.destroy(componentRef));
  }
}
