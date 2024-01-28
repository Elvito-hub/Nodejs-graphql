import { gql } from 'apollo-server-express';
import mongoose from 'mongoose';
import { gptquestionshandler } from '../../../middleware/gptquestionapi';
import multiplequestion from '../../../models/schemas/multiplequestion';

const MultipleQuestionTypedefs=gql`
scalar Date
type MultipleQuestionData{
    id:ID
    question:String
    answers:[String]
    correctAnswer:[String]
    field:String
    tags:[String]
    dateAdded:Date
    creator:String
    onApproved: Boolean
    creatorId: String
}
type Query{
    getAllMultipleQuestions:[MultipleQuestionData]
    getAllCreatorMultipleQuestions(userId: String):[MultipleQuestionData]
}
type Mutation{
    querygptbulkquestions(
        field: String
        description: String
    ):[multiplequestionReturn]
    createMultipleQuestion(
        question:String
        options:[String]
        correctAnswer:String
        tags:[String]
        field:String
        creatorId:ID
    ):MultipleQuestionData
}
`;

const MultipleQuestionResolvers = {
    Query:{
        getAllCreatorMultipleQuestions:async(_source: any, _args: any)=>{
            const creatorId = new mongoose.Types.ObjectId(_args.userId);
            return await multiplequestion.aggregate([
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
                        answers:1,
                        correctAnswer:1,
                        field:1,
                        dateAdded:1,
                        tags:1,
                        onApproved:1,
                        creatorId:1,
                    },
                },
            ]);
        },
        getAllMultipleQuestions: async () => {

            return await multiplequestion.aggregate([
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
                        answers:1,
                        correctAnswer:1,
                        field:1,
                        dateAdded:1,
                        tags:1,
                        onApproved:1,
                        creatorId:1,
                    },
                },
            ]);
        },
    },
    Mutation:{
        querygptbulkquestions:async(_source: any, _args: any)=>{
            const prompt = `
            Give me an array as stringified json without break lines and without the ' quotes of the array of 5 objects containing multiple questions about 
            ${_args.field} whith this description:${_args.description}
            , so the object will have 1.question:string ,2.options:[string] which contains array of 1 correct answer and 3 incorrect answer , 3. correctAnswer:string , 4.field which will be ${_args.field} and 5. tags: array of one word strings of tags you think this question can have`;
            return gptquestionshandler(prompt);
        },
        createMultipleQuestion:async(_source: any, _args: any)=>{
            const newMultipleQuestion=await multiplequestion.create(
                {
                    ..._args,
                    dateAdded:new Date(),
                }
            );
            newMultipleQuestion.save();
        },
    },
};

export { MultipleQuestionTypedefs, MultipleQuestionResolvers };
