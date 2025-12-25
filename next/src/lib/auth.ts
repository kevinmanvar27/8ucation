import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        schoolSlug: { label: 'School', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Find user with school context
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email,
            isActive: true,
            school: credentials.schoolSlug
              ? { code: credentials.schoolSlug, isActive: true }
              : { isActive: true },
          },
          include: {
            school: true,
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        });

        if (!user || !user.role) {
          throw new Error('Invalid email or password');
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        // Extract permissions
        const permissions = user.role.permissions.map((rp) => rp.permission.name);

        return {
          id: String(user.id),
          email: user.email,
          name: user.username,
          role: user.role.name,
          schoolId: String(user.schoolId),
          schoolName: user.school.name,
          schoolCode: user.school.code,
          permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.schoolName = user.schoolName;
        token.schoolCode = user.schoolCode;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.schoolId = token.schoolId as string;
        session.user.schoolName = token.schoolName as string;
        session.user.schoolCode = token.schoolCode as string;
        session.user.permissions = token.permissions as string[];
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    schoolId: string;
    schoolName: string;
    schoolCode: string;
    permissions: string[];
  }

  interface Session {
    user: User & {
      id: string;
      role: string;
      schoolId: string;
      schoolName: string;
      schoolCode: string;
      permissions: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    schoolId: string;
    schoolName: string;
    schoolCode: string;
    permissions: string[];
  }
}
