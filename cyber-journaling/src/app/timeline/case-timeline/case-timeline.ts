import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { JournalCase } from 'shared';
import { CaseTimelineCard } from '../case-timeline-card/case-timeline-card';
import { JournalCaseService } from '../../service/journal-case.service';
import { firstValueFrom } from 'rxjs';
import { ConfigDataService } from '../../service/config-data.service';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';

@Component({
  selector: 'case-timeline',
  imports: [
    CaseTimelineCard,
    MatSlideToggle,
    MatFormField,
    MatInput,
    MatLabel,
    MatIcon,
    CdkDropListGroup,
  ],
  templateUrl: './case-timeline.html',
  styleUrl: './case-timeline.scss',
})
export class CaseTimeline implements OnInit, OnDestroy {
  // reference is needed for removing the interval on ngOnDestroy
  intervalReference = 0;
  showClosedCase = signal(false);
  searchTerm = signal('');

  journalCases = signal<JournalCase[]>([]);

  #journalCaseService = inject(JournalCaseService);
  #configDataService = inject(ConfigDataService);

  teamFilterChangedEffect = effect(async () => {
    this.#configDataService.selectedTeamId();
    console.debug('Timeline: #configDataService.selectedTeamId changed, reloading data...');
    await this.loadData();
  });

  async ngOnInit() {
    this.intervalReference = setInterval(async () => {
      await this.refreshForPresenterMode();
    }, 10000);

    // load data from the service on component init
    await this.loadData();
  }

  // TODO: what is this? --> shitty naming
  async refreshForPresenterMode() {
    if (this.#configDataService.presenterMode) {
      await this.loadData();
    }
  }

  async loadData() {
    const data = await firstValueFrom(this.#journalCaseService.getJournalCases());
    console.debug('Timeline: #journalCaseService.getJournalCases():');
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

  caseVisibilityChanged(checked: boolean) {
    this.showClosedCase.set(checked);
  }

  searchChanged(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  ngOnDestroy(): void {
    // cleanup interval
    if (this.intervalReference) {
      clearInterval(this.intervalReference);
    }
  }
}
