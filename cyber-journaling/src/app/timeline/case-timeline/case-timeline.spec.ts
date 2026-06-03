import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseTimeline } from './case-timeline';

describe('CaseTimeline', () => {
  let component: CaseTimeline;
  let fixture: ComponentFixture<CaseTimeline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseTimeline],
    }).compileComponents();

    fixture = TestBed.createComponent(CaseTimeline);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
