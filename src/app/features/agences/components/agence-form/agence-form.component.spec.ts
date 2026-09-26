import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgenceFormComponent } from './agence-form.component';

describe('AgenceFormComponent', () => {
  let component: AgenceFormComponent;
  let fixture: ComponentFixture<AgenceFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgenceFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgenceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
