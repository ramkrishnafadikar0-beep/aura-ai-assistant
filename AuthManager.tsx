interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  createdAt: number;
  lastLogin: number;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    autoSave: boolean;
  };
}

interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}

export class AuthManager {
  private static instance: AuthManager;
  private currentUser: User | null = null;
  private sessionToken: string | null = null;
  private loginAttempts: Map<string, number> = new Map();

  static getInstance(): AuthManager {
    if (!this.instance) {
      this.instance = new AuthManager();
    }
    return this.instance;
  }

  constructor() {
    this.loadSession();
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Rate limiting
      const attempts = this.loginAttempts.get(email) || 0;
      if (attempts >= 5) {
        return { success: false, error: 'Too many login attempts. Please try again later.' };
      }

      // Mock authentication (in production, this would call your auth API)
      const mockUsers = [
        { email: 'demo@aura.ai', password: 'demo123', name: 'Demo User', tier: 'pro' as const },
        { email: 'admin@aura.ai', password: 'admin123', name: 'Admin User', tier: 'enterprise' as const },
      ];

      const user = mockUsers.find(u => u.email === email && u.password === password);
      
      if (!user) {
        this.loginAttempts.set(email, attempts + 1);
        return { success: false, error: 'Invalid email or password' };
      }

      // Create user session
      const userObj: User = {
        id: this.generateId(),
        email: user.email,
        name: user.name,
        subscriptionTier: user.tier,
        createdAt: Date.now(),
        lastLogin: Date.now(),
        preferences: {
          theme: 'auto',
          notifications: true,
          autoSave: true,
        }
      };

      const token = this.generateToken();
      const session: AuthSession = {
        user: userObj,
        token,
        expiresAt: Date.now() + 3600000 // 1 hour
      };

      this.saveSession(session);
      this.currentUser = userObj;
      this.sessionToken = token;
      this.loginAttempts.delete(email);

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  async signUp(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Mock user creation (in production, this would call your auth API)
      const user: User = {
        id: this.generateId(),
        email,
        name,
        subscriptionTier: 'free',
        createdAt: Date.now(),
        lastLogin: Date.now(),
        preferences: {
          theme: 'auto',
          notifications: true,
          autoSave: true,
        }
      };

      const token = this.generateToken();
      const session: AuthSession = {
        user,
        token,
        expiresAt: Date.now() + 3600000
      };

      this.saveSession(session);
      this.currentUser = user;
      this.sessionToken = token;

      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  signOut(): void {
    this.currentUser = null;
    this.sessionToken = null;
    localStorage.removeItem('aura-auth-session');
    localStorage.removeItem('aura-user-data');
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    if (!this.currentUser || !this.sessionToken) return false;
    
    const session = this.getSession();
    return session && session.expiresAt > Date.now();
  }

  hasSubscription(tier: 'pro' | 'enterprise'): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.subscriptionTier === tier || this.currentUser.subscriptionTier === 'enterprise';
  }

  updatePreferences(preferences: Partial<User['preferences']>): void {
    if (!this.currentUser) return;
    
    this.currentUser.preferences = {
      ...this.currentUser.preferences,
      ...preferences
    };
    
    this.saveUserData();
  }

  private generateId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  private generateToken(): string {
    return 'token_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
  }

  private saveSession(session: AuthSession): void {
    localStorage.setItem('aura-auth-session', JSON.stringify(session));
  }

  private getSession(): AuthSession | null {
    try {
      const stored = localStorage.getItem('aura-auth-session');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  private saveUserData(): void {
    if (this.currentUser) {
      localStorage.setItem('aura-user-data', JSON.stringify(this.currentUser));
    }
  }

  private loadSession(): void {
    try {
      const session = this.getSession();
      if (session && session.expiresAt > Date.now()) {
        this.currentUser = session.user;
        this.sessionToken = session.token;
      } else {
        // Clear expired session
        localStorage.removeItem('aura-auth-session');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }
}