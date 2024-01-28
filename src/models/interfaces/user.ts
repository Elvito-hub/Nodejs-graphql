import { Document } from 'mongoose';
export interface User extends Document {
    firstName: string;
    lastName: string;
    nickName: string;
    email: string;
    birthDate: Date;
    profilePicture?: string;
    gender: string;
    password: string;
    role: string;
    registerDate?: Date;
    matchPasswords(password: string): Promise<boolean>;
    getSignedToken(): string;
}
