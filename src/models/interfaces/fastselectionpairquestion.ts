import { Document } from 'mongoose';

export interface fastselectionpairTypes extends Document {
    question: string;
    options: [string];
    correctOptions: [string];
    field: string;
    tags: [string];
    dateAdded: Date;
    questionFiles: [string];
    creatorId: string;
}
