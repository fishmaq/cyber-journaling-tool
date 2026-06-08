import {Component, inject, OnInit, signal} from '@angular/core';
import {JournalCase} from 'shared/src/models';
import {CaseTimelineCard} from '../case-timeline-card/case-timeline-card';
import {JournalCaseService} from '../../service/journal-case.service';
import {firstValueFrom} from 'rxjs';

@Component({
  selector: 'case-timeline',
  imports: [
    CaseTimelineCard,
  ],
  templateUrl: './case-timeline.html',
  styleUrl: './case-timeline.scss',
})
export class CaseTimeline implements OnInit {
  journalCases = signal<JournalCase[]>([]);
  #journalCaseService = inject(JournalCaseService)

  async ngOnInit() {
    // load data from the service on component init
    const data = await firstValueFrom(
      this.#journalCaseService.getJournalCases()
    );
    console.debug('CaseTimeline: #journalCaseService.getJournalCases()')
    console.debug(data)

    this.journalCases.set(data);
  }
}
