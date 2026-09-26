import { TestBed } from '@angular/core/testing';

import { SatsService } from './sats.service';

describe('SatsService', () => {
  let service: SatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SatsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
