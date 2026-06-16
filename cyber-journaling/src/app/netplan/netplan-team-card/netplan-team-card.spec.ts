import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetplanTeamCard } from './netplan-team-card';

describe('NetplanTeamCard', () => {
  let component: NetplanTeamCard;
  let fixture: ComponentFixture<NetplanTeamCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetplanTeamCard],
    }).compileComponents();

    fixture = TestBed.createComponent(NetplanTeamCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
