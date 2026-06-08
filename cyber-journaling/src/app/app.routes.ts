import {Routes} from '@angular/router';
import {CaseTimeline} from './timeline/case-timeline/case-timeline';

export const routes: Routes = [
  {
    path: 'timeline',
    component: CaseTimeline
  },
  {
    path: 'test',
    component: CaseTimeline
  }
];
