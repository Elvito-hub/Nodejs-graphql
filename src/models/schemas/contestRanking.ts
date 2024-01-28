import { model, Schema } from 'mongoose';

const QuestionAnswerSchema = new Schema({
    indexQuestion:{
        type:Number,
    },
    answer:{
        type:String,
    },
    score:{
        type:Number,
    },
});

const UserScoreSchema = new Schema({
    userId:{
        type: Schema.Types.ObjectId, ref: 'User', required: true,
    },
    score:{
        type: Number,
        required:[true, 'Plz provide user score'],
    },
    userAnswers:{
        type: [QuestionAnswerSchema],
    },
});

const ContestRankingsSchema = new Schema({
    contestId:{
        type: Schema.Types.ObjectId, ref: 'Contest', required: true,
    },
    userRankings:[UserScoreSchema],
});

export default model('ContestRankings', ContestRankingsSchema);
