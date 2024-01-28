import { Document } from 'mongoose';

export interface quickQuestionsTypes {
    question: string;
    questionFile: [string];
    answers: [string];
    correctAnswers: [string];
    score: number;
}
export interface topicQuestions{
    topic: string;
    question: string;
    answer: string;
}
export interface singleSelectionTypes {
    question: string;
    options: [string];
    correctOptions: [string];
}

export interface pairSelectionTypes {
    question: string;
    options: [string];
    correctPairs: [string];
}

export interface lastSectionTypes {
    questionSet: [string];
    answer: string;
}

export interface ContestTypes extends Document {
    title: string;
    dateCreated: Date;
    dateTobeLaunched: Date;
    quickQuestions: [quickQuestionsTypes];
    topicQuestions: [topicQuestions];
    singleSelection: [singleSelectionTypes];
    pairselection: [pairSelectionTypes];
    lastSection: [lastSectionTypes];
}
