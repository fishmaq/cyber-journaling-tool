import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventTimelineCard } from './event-timeline-card';

describe('EventTimelineCard', () => {
  let component: EventTimelineCard;
  let fixture: ComponentFixture<EventTimelineCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventTimelineCard],
    }).compileComponents();

    fixture = TestBed.createComponent(EventTimelineCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
