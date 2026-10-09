import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isPublicAuthRoute = req.url.includes('/auth/login') || req.url.includes('/auth/register');
  const isPublicOffersRoute = req.method === 'GET'
    && new URL(req.url, 'http://localhost').pathname.endsWith('/v1/offres/get_all');

  // localStorage n'existe pas côté SSR (Node) : on ne l'utilise que dans le navigateur.
  // Un token périmé sur une route publique peut provoquer un 403 côté backend.
  const token = !isPublicAuthRoute && !isPublicOffersRoute && typeof window !== 'undefined'
    ? window.localStorage.getItem('token')
    : null;

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
