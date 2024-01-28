import { gql } from 'apollo-server-express';
import mongoose from 'mongoose';
import typingquestion from '../../../models/schemas/typingquestion';

const TypingQuestionTypedefs=gql`
scalar Date
type TypingQuestionData{
    id:ID
    question:String
    answer:[String]
    field:String
    tags:[String]
    dateAdded:Date
    creator:String
    onApproved: Boolean
    creatorId: String
}
type Query{
    getAllTypingQuestions:[TypingQuestionData]
    getAllCreatorTypingQuestions(userId: String):[TypingQuestionData]
}
`;

const TypingQuestionResolvers = {
    Query:{
        getAllCreatorTypingQuestions:async(_source: any, _args: any)=>{
            const creatorId = new mongoose.Types.ObjectId(_args.userId);
            return await typingquestion.aggregate([
                {
                    $match: { creatorId: creatorId },
                },
                {
                    $lookup:{
                        from: 'users',
                        localField: 'creatorId',
                        foreignField: '_id',
                        as: 'creator',
                    },
                },
                {
                    $project: {
                        id:'$_id',
                        text: 1,
                        creator: { $concat: [{ $arrayElemAt: ['$creator.firstName', 0] }, ' ', { $arrayElemAt: ['$creator.lastName', 0] }] },
                        question:1,
                        answer:1,
                        field:1,
                        dateAdded:1,
                        tags:1,
                        onApproved:1,
                        creatorId: 1,
                    },
                },
            ]);
        },
        getAllTypingQuestions: async () => {
            return await typingquestion.aggregate([
                {
                    $lookup:{
                        from: 'users',
                        localField: 'creatorId',
                        foreignField: '_id',
                        as: 'creator',
                    },
                },
                {
                    $project: {
                        id:'$_id',
                        text: 1,
                        creator: { $concat: [{ $arrayElemAt: ['$creator.firstName', 0] }, ' ', { $arrayElemAt: ['$creator.lastName', 0] }] },
                        question:1,
                        answer:1,
                        field:1,
                        dateAdded:1,
                        tags:1,
                        onApproved:1,
                        creatorId: 1,
                    },
                },
            ]);
        },
    },
};

export { TypingQuestionResolvers, TypingQuestionTypedefs };
