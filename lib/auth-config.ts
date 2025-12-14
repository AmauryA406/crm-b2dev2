import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// Liste des emails autorisés à accéder au CRM
export const AUTHORIZED_EMAILS = [
  'amauryall.b2dev@gmail.com',  // Amaury - Commercial
  'louis.winkelmuller03@gmail.com',  // Partenaire - Développement
  // Ajouter d'autres emails autorisés ici
];

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // Vérifier si l'email est dans la liste des autorisés
      if (user.email && AUTHORIZED_EMAILS.includes(user.email)) {
        return true;
      }

      // Email non autorisé - refuser la connexion
      return false;
    },

    async session({ session, token }) {
      // Ajouter l'information d'autorisation à la session
      if (session.user?.email && AUTHORIZED_EMAILS.includes(session.user.email)) {
        return session;
      }

      // Ne devrait pas arriver car déjà filtré dans signIn
      return session;
    },

    async jwt({ token, user }) {
      // Persister les informations utilisateur dans le token
      if (user) {
        token.email = user.email;
      }
      return token;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login', // Rediriger vers login en cas d'erreur
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,
};