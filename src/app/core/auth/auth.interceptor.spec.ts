import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    window.localStorage.setItem('token', 'test-token');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    window.localStorage.removeItem('token');
  });

  it('does not attach a stored token to the public offers list', () => {
    http.get('/api/v1/offres/get_all').subscribe();

    const request = httpTestingController.expectOne('/api/v1/offres/get_all');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush([]);
  });

  it('keeps attaching a stored token to protected requests', () => {
    http.get('/api/v1/clients/me').subscribe();

    const request = httpTestingController.expectOne('/api/v1/clients/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush({});
  });
});
