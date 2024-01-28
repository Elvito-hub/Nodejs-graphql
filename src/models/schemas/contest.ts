import { model, Schema } from 'mongoose';
import { ContestTypes } from '../interfaces/contest';
const QuickQuestionsSchema = new Schema({
    question: {
        type: String,
        required: [true, 'Please write the question'],
    },
    answers: {
        type: [String],
        required: false,
    },
    correctAnswer: {
        type: [String],
        required: false,
    },
    score: {
        type: Number,
        default:20,
    },
    time:{
        type: Number,
        required: true,
        default:20,
    },
});
const fastSelectionSingleSchema = new Schema({
    question: {
        type: String,
        required: [true, 'Please specify fast selection Single question'],
    },
    options: {
        type: [String],
        required: [true, 'Please specify fast selection Single options'],
    },
    correctOptions: {
        type: [String],
        required: [true, 'Please specify fast selection correct options'],
    },
});

const fastSelectionPairSchema = new Schema({
    question: {
        type: String,
        required: [true, 'Please specify fast selection Single question'],
    },
    options: {
        type: [String],
        required: [true, 'Please specify fast selection Single options'],
    },
    correctPair: {
        type: [String],
        required: [true, 'Please specify fast selection correct options'],
    },
});
const lastSectionSchema = new Schema({
    questionSet: {
        type: [String],
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
});
const topicQuestions = new Schema({
    topic: {
        type: String,
        required: true,
    },
    question: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
});

const HintSchema = new Schema({
    index: {
        type: Number,
        required: true,
    },
    hint: {
        type: String,
        required: true,
    },
});
const typingQuestions = new Schema({
    question:{
        type: String,
        required: true,
    },
    answer:{
        type: String,
        required: true,
    },
    time:{
        type: Number,
        required: true,
        default: 20,
    },
    score: {
        type: Number,
        default:20,
    },
    hints: {
        type: [HintSchema],
    },
});

const bookingSchema = new Schema({
    userInd : {
        type: Number,
    },
    userId:{
        type: Schema.Types.ObjectId, ref: 'User',
    },
});

const contestSchema = new Schema({
    name: {
        type: String,
        required: [true, "Please specify contest's title"],
    },
    description:{
        type:String,
    },
    dateCreated: {
        type: String,
        default:new Date(),
    },
    dateTobeLaunched: {
        type: String,
        required: [true, "Please specify contest's date to be launched"],
    },
    timeStampStart:{
        type: Number,
        required:true,
    },
    timeStampEnd:{
        type: Number,
        required: true,
    },
    multipleQuestion: {
        type: [QuickQuestionsSchema],
        required: true,
    },
    typingQuestion: {
        type: [typingQuestions],
        required: false,
    },
    bookings:[{
        type: bookingSchema,
        required: false,
    }],
    // topicQuestions:{
    //     type:[topicQuestions],
    //     required:true,
    // },
    // singleSelection: {
    //     type: [fastSelectionSingleSchema],
    //     required: true,
    // },
    // pairselection: {
    //     type: [fastSelectionPairSchema],
    //     required: true,
    // },
    // lastSection: {
    //     type: [lastSectionSchema],
    //     required: true,
    // },
    creatorId:{
        type: Schema.Types.ObjectId, ref: 'User', required: true,
    },
    onApproved:{
        type:Boolean,
        default:false,
    },
    duration:{
        type: Number,
        required: true,
    },
});

export default model<ContestTypes>('Contest', contestSchema);
