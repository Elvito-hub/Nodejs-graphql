import { Document } from 'mongoose';

export interface fastselectionsingleTypes extends Document {
    question: string;
    options: [string];
    correctPair: [string];
    field: string;
    tags: [string];
    dateAdded: Date;
    questionFiles: [string];
    creatorId: string;
}
