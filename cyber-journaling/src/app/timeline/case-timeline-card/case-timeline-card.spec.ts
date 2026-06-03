import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseTimelineCard } from './case-timeline-card';

describe('CaseTimelineCard', () => {
  let component: CaseTimelineCard;
  let fixture: ComponentFixture<CaseTimelineCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseTimelineCard],
    }).compileComponents();

    fixture = TestBed.createComponent(CaseTimelineCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
