import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Le middleware s'exécute seulement si l'utilisateur est authentifié
    // grâce à la configuration withAuth ci-dessous
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Vérifier si l'utilisateur a un token valide
        // Le callback signIn dans auth-config.ts s'assure déjà que
        // seuls les emails autorisés peuvent se connecter
        return !!token;
      },
    },
  }
);

// Configuration des routes à protéger
export const config = {
  matcher: [
    // Protéger toutes les routes sauf :
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)',
  ],
};