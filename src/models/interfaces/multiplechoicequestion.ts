import { Document } from 'mongoose';

export interface multipleQuestionTypes extends Document {
    question: string;
    questionFiles: [string];
    options: [string];
    correctAnswer: [string];
    field: string;
    tags: [string];
    dateAdded: Date;
    creatorId: string;
}
