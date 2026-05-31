export interface AuthUser {
    id: string;
    email?: string | null;
}

export function useAuth() {
    const user: AuthUser = { id: 'guest' };
    const logout = () => {};
    return { user, isLoading: false, isAuthenticated: true, logout };
}
