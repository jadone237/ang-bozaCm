import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // localStorage n'existe pas côté SSR (Node) : on ne l'utilise que dans le navigateur.
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
