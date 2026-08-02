import { User, AuthSession } from '../types/auth.types';
import { localStore } from '../lib/storage';

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthStoreListener = (state: AuthState) => void;

/**
 * Lightweight, SSR-safe reactive Auth Store with LocalStorage synchronization.
 */
export class AuthStore {
  private static instance: AuthStore | null = null;
  private state: AuthState;
  private listeners = new Set<AuthStoreListener>();

  private constructor() {
    const initialToken = localStore.getItem<string>('auth_token', null);
    const initialRefreshToken = localStore.getItem<string>('auth_refresh_token', null);
    const initialUser = localStore.getItem<User>('user_data', null);

    this.state = {
      user: initialUser,
      token: initialToken,
      refreshToken: initialRefreshToken,
      isAuthenticated: Boolean(initialToken && initialUser),
      isLoading: false,
    };
  }

  public static getInstance(): AuthStore {
    if (!AuthStore.instance) {
      AuthStore.instance = new AuthStore();
    }
    return AuthStore.instance;
  }

  public getState(): AuthState {
    return { ...this.state };
  }

  public setSession(session: AuthSession): void {
    this.state = {
      user: session.user,
      token: session.accessToken,
      refreshToken: session.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    };

    localStore.setItem('auth_token', session.accessToken);
    localStore.setItem('auth_refresh_token', session.refreshToken);
    localStore.setItem('user_data', session.user);

    this.notify();
  }

  public updateUser(partialUser: Partial<User>): void {
    if (!this.state.user) return;

    const updatedUser = { ...this.state.user, ...partialUser };
    this.state = {
      ...this.state,
      user: updatedUser,
    };

    localStore.setItem('user_data', updatedUser);
    this.notify();
  }

  public logout(): void {
    this.state = {
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    };

    localStore.removeItem('auth_token');
    localStore.removeItem('auth_refresh_token');
    localStore.removeItem('user_data');

    this.notify();
  }

  public setLoading(isLoading: boolean): void {
    this.state = { ...this.state, isLoading };
    this.notify();
  }

  public subscribe(listener: AuthStoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }
}

export const authStore = AuthStore.getInstance();
