import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {DefacementCallbackModel} from '../model/intel-results/defacement/defacement.callback.model';

@Injectable({ providedIn: 'root' })
export class DefacementService {
  private dummyData: DefacementCallbackModel[] = [
    {
      m_location: ['USA', 'Germany'],
      m_attacker: ['Hacker Group A'],
      m_team: 'CyberSec Team X',
      m_web_server: ['Apache', 'Nginx'],
      m_base_url: 'https://example.com',
      m_ip: ['192.168.1.1', '192.168.1.2'],
      m_leak_date: '2025-03-10',
      m_web_url: ['https://example.com/data-leak'],
      m_screenshot: 'https://example.com/screenshot.jpg',
      m_mirror_links: ['https://mirror1.com', 'https://mirror2.com']
    }
  ];

  getResults(): Observable<DefacementCallbackModel[]> {
    return of(this.dummyData);
  }
}
