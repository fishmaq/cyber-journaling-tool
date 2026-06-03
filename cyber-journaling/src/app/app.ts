import {Component} from '@angular/core';
import {CaseTimeline} from './timeline/case-timeline/case-timeline';

@Component({
  selector: 'app-root',
  imports: [
    CaseTimeline
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
}
