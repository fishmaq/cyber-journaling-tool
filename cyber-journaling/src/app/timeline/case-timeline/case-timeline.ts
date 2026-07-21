import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { JournalCase } from 'shared';
import { CaseTimelineCard } from '../case-timeline-card/case-timeline-card';
import { JournalCaseService } from '../../service/journal-case.service';
import { firstValueFrom } from 'rxjs';
import { ConfigDataService } from '../../service/config-data.service';
import { MatSlideToggle } from '@angular/material/slide-toggle';

@Component({
  selector: 'case-timeline',
  imports: [CaseTimelineCard, MatSlideToggle],
  templateUrl: './case-timeline.html',
  styleUrl: './case-timeline.scss',
})
export class CaseTimeline implements OnInit, OnDestroy {
  intervalReference = 0;
  showClosedCase = false;

  journalCases = signal<JournalCase[]>([]);

  #journalCaseService = inject(JournalCaseService);
  #configDataService = inject(ConfigDataService);
  journalCasesFiltered = this.journalCases();

  async ngOnInit() {
    this.intervalReference = setInterval(async () => {
      await this.refreshForPresenterMode();
    }, 10000);

    // load data from the service on component init
    await this.loadData();
  }

  updateFilteredListEffect = effect(() => {
    this.journalCases();
    this.caseVisibilityChanged(this.showClosedCase);
  });

  async refreshForPresenterMode() {
    if (this.#configDataService.presenterMode) {
      await this.loadData();
    }
  }

  async loadData() {
    const data = await firstValueFrom(this.#journalCaseService.getJournalCases());
    console.debug('CaseTimeline: #journalCaseService.getJournalCases():');
    console.debug(data);

    this.journalCases.set(data);
    // wait until the list is updated
    setTimeout(() => this.scrollTimelinesToEnd(), 500);
  }

  scrollTimelinesToEnd() {
    const timelines = document.getElementsByClassName('case-card-track');

    for (const timeline of timelines as HTMLCollectionOf<HTMLElement>) {
      timeline.scrollTo({
        left: timeline.scrollWidth,
        behavior: 'smooth',
      });
    }
  }

  scrollTimelineToEndEffect = effect(() => {
    this.journalCases();
    if (this.#configDataService.presenterMode) {
      // wait for a bit to let the dom refresh
      setTimeout(() => {
        this.scrollTimelinesToEnd();
      }, 500);
    }
  });

  ngOnDestroy(): void {
    // cleanup interval
    if (this.intervalReference) {
      clearInterval(this.intervalReference);
    }
  }

  caseVisibilityChanged(checked: boolean) {
    this.showClosedCase = checked;
    this.journalCasesFiltered = this.journalCases().filter((journalCase) => {
      if (journalCase.case_state === undefined || this.showClosedCase) {
        return true;
      } else {
        // TODO: maybe refactor
        return journalCase.case_state.name !== 'Closed';
      }
    });
    console.debug(this.journalCasesFiltered);
  }
}
