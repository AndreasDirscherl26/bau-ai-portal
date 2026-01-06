import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

const demo = process.env.DEMO_MODE === 'true';

export default NextAuth({
  providers: demo ? [] : [
    AzureADProvider({
      tenantId: process.env.AZURE_AD_TENANT_ID,
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      authorization: {
        params: {
          // Delegated scopes
          scope: "openid profile email offline_access User.Read Files.Read Calendars.Read"
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      // Store the access token (Microsoft Graph)
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    }
  }
});
