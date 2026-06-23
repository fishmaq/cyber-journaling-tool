import {ComponentFixture, TestBed} from '@angular/core/testing';

import {Netplan} from './netplan';
import {Team} from 'shared';
import {of} from 'rxjs';
import {netplanServiceMock} from '../../../testing/mocks/service';
import {NetplanService} from '../../service/netplan.service';

describe('Netplan', () => {
  let component: Netplan;
  let fixture: ComponentFixture<Netplan>;

  beforeEach(async () => {
    vi.resetAllMocks();
    await TestBed.configureTestingModule({
      imports: [Netplan],
      providers: [{provide: NetplanService, useValue: netplanServiceMock}]
    }).compileComponents();

    fixture = TestBed.createComponent(Netplan);
    component = fixture.componentInstance;

    netplanServiceMock.getNetplans.mockReturnValue(of([{id: 1}]));

    await fixture.whenStable();
  });

  it('should load netplans', async () => {
    const data = [{id: 1}] as Team[];
    netplanServiceMock.getNetplans.mockReturnValue(of(data));

    await component.loadData();

    expect(component.netplanList()).toEqual(data);
  });

  it('should load data on init', async () => {
    const spy = vi
      .spyOn(component, 'loadData')
      .mockResolvedValue(undefined);

    await component.ngOnInit();

    expect(spy).toHaveBeenCalled();
  });

  it('should clear interval on destroy', () => {
    const spy = vi.spyOn(globalThis, 'clearInterval');

    component.intervalReference = 123;

    component.ngOnDestroy();

    expect(spy).toHaveBeenCalledWith(123);
  });

  it('should sort netplan groups by priority', () => {
    const data = [
      {
        netplan_group: [
          {priority: 5},
          {priority: 1},
          {priority: 3},
        ],
      },
    ] as Team[];

    component.sortData(data);

    expect(
      data[0].netplan_group!.map(g => g.priority)
    ).toEqual([1, 3, 5]);
  });

  it('should sort hosts by priority', () => {
    const data = [
      {
        netplan_group: [
          {
            host: [
              {priority: 9},
              {priority: 2},
              {priority: 5},
            ],
          },
        ],
      },
    ] as Team[];

    component.sortData(data);

    expect(
      data[0].netplan_group![0].host!.map(h => h.priority)
    ).toEqual([2, 5, 9]);
  });

});
