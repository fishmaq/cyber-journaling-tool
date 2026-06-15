import {Routes} from '@angular/router';
import {CaseTimeline} from './timeline/case-timeline/case-timeline';
import {Case} from './case/case/case';
import {Event} from './event/event/event';

export const routes: Routes = [
  {
    path: 'timeline',
    component: CaseTimeline
  },
  {
    path: 'case',
    component: Case
  },
  {
    path: 'event',
    component: Event
  }
];
