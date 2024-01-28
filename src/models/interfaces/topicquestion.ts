import { Document } from 'mongoose';

export interface topicquestionTypes extends Document {
    topic: string;
    question: string;
    answer: string;
    dateAdded: Date;
    questionFiles: [string];
    creatorId: string;
}
