import { model, Schema } from 'mongoose';
import { ThreedeeperquestionTypes } from '../interfaces/threedeeperquestions';

const threedeeperquestionSchema = new Schema({
    questionSet: {
        type: [String],
        required: true,
    },
    questionFiles:{
        type:[String],
        required:false,
    },
    answer: {
        type: String,
        required: true,
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
});

export default model<ThreedeeperquestionTypes>('ThreeDeeperQuestions', threedeeperquestionSchema);
