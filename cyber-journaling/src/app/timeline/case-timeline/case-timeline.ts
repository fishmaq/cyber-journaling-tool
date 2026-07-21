import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
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
  imports: [CaseTimelineCard, MatSlideToggle, MatFormField, MatInput, MatLabel, MatIcon, CdkDropListGroup],
  templateUrl: './case-timeline.html',
  styleUrl: './case-timeline.scss',
})
export class CaseTimeline implements OnInit, OnDestroy {
  intervalReference = 0;
  showClosedCase = signal(false);
  searchTerm = signal('');

  journalCases = signal<JournalCase[]>([]);

  #journalCaseService = inject(JournalCaseService);
  #configDataService = inject(ConfigDataService);

  journalCasesFiltered = computed(() => {
    const selectedTeamId = this.#configDataService.selectedTeamId();
    const showClosedCase = this.showClosedCase();
    const search = this.searchTerm().trim().toLowerCase();
    return this.journalCases().filter((journalCase) => {
      const matchesTeam = selectedTeamId == null || journalCase.team_id === selectedTeamId;
      const matchesState =
        showClosedCase || journalCase.case_state === undefined || journalCase.case_state.name !== 'Closed';
      const matchesSearch = search === '' || this.#matchesSearch(journalCase, search);
      return matchesTeam && matchesState && matchesSearch;
    });
  });

  async ngOnInit() {
    this.intervalReference = setInterval(async () => {
      await this.refreshForPresenterMode();
    }, 10000);

    // load data from the service on component init
    await this.loadData();
  }

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
    this.showClosedCase.set(checked);
  }

  searchChanged(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  #matchesSearch(journalCase: JournalCase, search: string) {
    const caseNumber = 'case-' + journalCase.id.toString().padStart(5, '0');
    const eventText = (journalCase.journal_event ?? [])
      .map(event => `${event.title ?? ''} ${event.details ?? ''}`)
      .join(' ');
    const haystack = [
      journalCase.title ?? '',
      journalCase.id.toString(),
      caseNumber,
      eventText
    ].join(' ').toLowerCase();
    return haystack.includes(search);
  }
}
