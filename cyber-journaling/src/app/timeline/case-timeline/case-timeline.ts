import {Component, effect, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {JournalCase} from 'shared/src/models';
import {CaseTimelineCard} from '../case-timeline-card/case-timeline-card';
import {JournalCaseService} from '../../service/journal-case.service';
import {firstValueFrom} from 'rxjs';
import {ConfigDataService} from '../../service/config-data.service';

@Component({
  selector: 'case-timeline',
  imports: [
    CaseTimelineCard,
  ],
  templateUrl: './case-timeline.html',
  styleUrl: './case-timeline.scss',
})
export class CaseTimeline implements OnInit, OnDestroy {
  intervalReference = 0;

  journalCases = signal<JournalCase[]>([]);

  #journalCaseService = inject(JournalCaseService)
  #configDataService = inject(ConfigDataService)

  async ngOnInit() {
    this.intervalReference = setInterval(async () => {
      await this.refreshForPresenterMode();
    }, 10000);

    // load data from the service on component init
    await this.loadData()
  }

  async refreshForPresenterMode() {
    if (this.#configDataService.presenterMode) {
      await this.loadData();
    }
  }

  async loadData() {
    const data = await firstValueFrom(
      this.#journalCaseService.getJournalCases()
    );
    console.debug('CaseTimeline: #journalCaseService.getJournalCases():')
    console.debug(data)

    this.journalCases.set(data);
  }

  scrollTimelinesToEnd() {
    const timelines = document.getElementsByClassName('case-card-track');

    for (const timeline of timelines as HTMLCollectionOf<HTMLElement>) {
      timeline.scrollTo({
        left: timeline.scrollWidth,
        behavior: 'smooth'
      });
    }
  }

  scrollTimelineToEndEffect = effect(() => {
    this.journalCases();
    if (this.#configDataService.presenterMode) {
      // wait for a bit to let the dom refresh
      setTimeout(() => {
        this.scrollTimelinesToEnd();
      }, 500)
    }
  })

  ngOnDestroy(): void {
    // cleanup interval
    if (this.intervalReference) {
      clearInterval(this.intervalReference);
    }
  }
}
