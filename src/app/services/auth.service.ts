import {Injectable} from '@angular/core';
import {Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})

export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private auth: Auth) {
        //Listen to auth state changes
        onAuthStateChanged(this.auth, (user) => {
            this.currentUserSubject.next(user);
        });
}
    //Email and password sign in
    async signIn(email: string, password: string): Promise<void>{
        try {
            await signInWithEmailAndPassword(this.auth, email, password);
        } catch (error) {
            throw error;
    }
}   
    //Sign up
    async signUp(email: string, password: string): Promise<void> {
        try {
            await createUserWithEmailAndPassword(this.auth, email, password);
        } catch (error) {
            throw error;
        }
    }
    //Sign out
    async signOut(): Promise<void> {
        try {
            await signOut(this.auth);
        } catch (error) {
            throw error;
        }
    }
    //Get current user
    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    //Get ID token for backend authentication
    async getIdToken(): Promise<string | null> {
        const user = this.getCurrentUser();
        if (user) {
            return await user.getIdToken();
        }
        return null;
    }
    // Check if user is authenticated
    isAuthenticated(): boolean {
        return this.getCurrentUser() !== null;
    }



}