import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { checkIfUserExists } from "../../../lib/userStore";

// Environment variable controls
const allowGoogleAuth = process.env.ALLOW_GOOGLE_AUTH === 'true';

export default NextAuth({
  providers: [
    // Only add Google provider if auth is enabled
    ...(allowGoogleAuth ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 Sign-in attempt:', { 
        email: user.email, 
        provider: account?.provider,
        allowGoogleAuth 
      });

      // Handle Google sign-in
      if (account?.provider === 'google') {
        // Check global kill switch
        if (!allowGoogleAuth) {
          console.log('❌ Google auth blocked by global kill switch');
          return false;
        }
        
        // Check if user is registered in Google Sheets
        const exists = await checkIfUserExists(user.email);
        if (!exists) {
          console.log(`❌ User ${user.email} not found in registered users`);
          return false;
        }
        
        console.log(`✅ User ${user.email} authenticated successfully`);
        return true;
      }
      
      // Allow other providers (if any)
      return true;
    },
    
    async jwt({ token, user, account }) {
      // Add custom claims to JWT
      if (account?.provider === 'google') {
        token.provider = 'google';
        token.isRegistered = await checkIfUserExists(token.email);
      }
      return token;
    },
    
    async session({ session, token }) {
      // Add custom claims to session
      if (token) {
        session.user.provider = token.provider;
        session.user.isRegistered = token.isRegistered;
      }
      return session;
    },
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/auth/signout',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  debug: process.env.NODE_ENV === 'development',
});
