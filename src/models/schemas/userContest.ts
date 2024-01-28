import { model, Schema } from 'mongoose';

const QuestionAnswerSchema = new Schema({
    questionIndex:{
        type:Number,
    },
    answer:{
        type:[String],
    },
    score:{
        type:Number,
    },
});

const UserContestPackageSchema = new Schema({
    multipleChoiceAnswers:[QuestionAnswerSchema],
});
const UserContestSchema=new Schema({
    userId:{
        type: Schema.Types.ObjectId, ref: 'User', required: true,
    },
    contestId:{
        type: Schema.Types.ObjectId, ref: 'Contest', required: true,
    },
    UserContestPackage:{
        type: UserContestPackageSchema,
    },
});

export default model<any>('UserContest', UserContestSchema);
