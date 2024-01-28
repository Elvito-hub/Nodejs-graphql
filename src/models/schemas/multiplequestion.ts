import { model, Schema } from 'mongoose';
import { multipleQuestionTypes } from '../interfaces/multiplechoicequestion';

const multiplequestionSchema = new Schema({
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
    field:{
        type: String,
        required: [true, 'Please write the question\'s field'],
    },
    tags:{
        type: [String],
        required:false,
    },
    dateAdded:{
        type: Date,
        required:true,
    },
    creatorId:{
        type: Schema.Types.ObjectId, ref: 'User', required: true,
    },
    onApproved:{
        type: Boolean,
        default: false,
    },
});

export default model<multipleQuestionTypes>('MultipleQuestion', multiplequestionSchema);
