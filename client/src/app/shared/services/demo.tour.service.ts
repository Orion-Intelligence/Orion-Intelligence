import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TourStep } from '../model/demo-tour/demo.tour.model';
import { userMetaData } from '../model/company-profile/node.model';
import { AppService } from '../../services/core/app/app.service';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DemoTourService {
  private steps: TourStep[] = [];
  private capturedValues = new Map<string, string>();
  private currentStepIndex = new BehaviorSubject<number>(-1);

  currentStep$ = this.currentStepIndex.asObservable();

  constructor(private appService: AppService,private apiService:ApiService){}

  async startTourForCurrentLicense(): Promise<void> {
    await this.appService.loadDemoTourConfig();
    const steps = this.getTourStepsForCurrentLicense();
    if (!steps.length) {
      this.currentStepIndex.next(-1);
      return;
    }
    this.startTour(steps);
  }

  startTour(steps: TourStep[]) {
    this.steps = steps;
    this.capturedValues.clear();
    this.currentStepIndex.next(0);
  }

  next() {
    if (this.currentStepIndex.value < this.steps.length - 1) {
      this.currentStepIndex.next(this.currentStepIndex.value + 1);
    }
    else {
      console.log("next else")
      this.end();
    }
  }

  prev() {
    if (this.currentStepIndex.value > 0) {
      this.currentStepIndex.next(this.currentStepIndex.value - 1);
    }
  }

  end() {
    this.appService.userSessionData.update(state => ({
      ...state,
      user: {
        ...state.user,
        demo_tour: true
      }
    }));
    this.updateUser();
    this.currentStepIndex.next(-1);
  }

  updateUser() {
    const route = "update/current/user";
    const currentUser = this.appService.userSessionData().user;
    const userMeta: userMetaData = {
      username: currentUser.username,
      twofa_enabled: currentUser.twofa_enabled,
      theme: currentUser.theme,
      preferences: currentUser.preferences,
      demo_tour: currentUser.demo_tour
    };
    this.apiService.post(route, userMeta).subscribe({
      next: () => {
      },
      error: (err) => {
        console.error('Failed to update demo tour status', err);
      },
    });
  }

  getCurrentStep(): TourStep | null {
    return this.steps[this.currentStepIndex.value] || null;
  }

  getStep(index: number): TourStep | null {
    return this.steps[index] || null;
  }

  getTotalSteps(): number {
    return this.steps.length;
  }

  setCapturedValue(stepId: string, value: string): void {
    this.capturedValues.set(stepId, value);
  }

  getCapturedValue(stepId: string): string {
    return this.capturedValues.get(stepId) || '';
  }

  getCapturedValues(): Record<string, string> {
    return Object.fromEntries(this.capturedValues.entries());
  }

  private getTourStepsForCurrentLicense(): TourStep[] {
    const config = this.appService.demoTourConfig();
    const licenses = this.appService.userSessionData().user.license ?? [];

    for (const license of licenses) {
      const steps = config[license];
      if (steps?.length) {
        return steps;
      }
    }

    return config['default'] ?? [];
  }
}
