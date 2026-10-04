import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Routes publiques : ne jamais y attacher un token, même s'il en traîne un (stale)
  // dans localStorage depuis une session précédente — sinon un token invalide pour
  // cette route peut se faire rejeter en 403 par le backend au lieu d'être ignoré.
  const isPublicAuthRoute = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  // localStorage n'existe pas côté SSR (Node) : on ne l'utilise que dans le navigateur.
  const token = !isPublicAuthRoute && typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
