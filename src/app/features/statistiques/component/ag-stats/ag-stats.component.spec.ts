import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgStatsComponent } from './ag-stats.component';

describe('AgStatsComponent', () => {
  let component: AgStatsComponent;
  let fixture: ComponentFixture<AgStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgStatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
