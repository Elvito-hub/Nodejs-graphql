import { Document } from 'mongoose';

export interface ThreedeeperquestionTypes extends Document {
    questionSet: [string];
    answer: string;
    field: string;
    tags: [string];
    dateAdded: Date;
    questionFiles: [string];
    creatorId: string;
}
