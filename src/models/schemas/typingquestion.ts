import { model, Schema } from 'mongoose';

const typingquestionSchema = new Schema({
    question:{
        type: String,
        required: [true, 'Please write the question'],
    },
    answer:{
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

export default model('TypingQuestion', typingquestionSchema);
