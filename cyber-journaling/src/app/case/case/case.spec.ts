import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Case } from './case';

describe('Case', () => {
  let component: Case;
  let fixture: ComponentFixture<Case>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Case],
    }).compileComponents();

    fixture = TestBed.createComponent(Case);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
