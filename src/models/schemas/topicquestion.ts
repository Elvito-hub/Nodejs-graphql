import { model, Schema } from 'mongoose';
import { topicquestionTypes } from '../interfaces/topicquestion';

const topicQuestionSchema = new Schema({
    topic:{
        type: String,
        required: [true, 'Please specify the question\'s topic'],
    },
    question: {
        type: String,
        required: [true, 'Please specify the question'],
    },
    questionFiles:{
        type:[String],
        required:false,
    },
    answer: {
        type: String,
        required: [true, 'Please specify the question\'s answer'],
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

export default model<topicquestionTypes>('TopicQuestion', topicQuestionSchema);
