import { model, Schema } from 'mongoose';
import { fastselectionpairTypes } from '../interfaces/fastselectionpairquestion';

const fastselectionpairSchema = new Schema({
    question: {
        type: String,
        required: [true, 'Please specify fast selection Single question'],
    },
    questionFiles:{
        type:[String],
        required:false,
    },
    options: {
        type: [String],
        required: [true, 'Please specify fast selection Single options'],
    },
    correctPair: {
        type: [String],
        required: [true, 'Please specify fast selection correct options'],
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

export default model<fastselectionpairTypes>('FastSelectionPair', fastselectionpairSchema);
