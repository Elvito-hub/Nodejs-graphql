import { gql } from 'apollo-server-express';
import { gptquestionshandler } from '../../../middleware/gptquestionapi';
import threedeeperquestions from '../../../models/schemas/threedeeperquestions';

const ThreeDeeperQuestionsTypedefs=gql`
scalar Date
type ThreeDeeperQuestionData{
    id:ID
    questionSet:[String]
    answer:String
    field:String
    tags:[String]
    dateAdded:Date
    creator:String
}
type ThreeDeeperQuestionReturn{
    questionSet:[String]
    answer:String
    field:String
    tags:[String]
  }
  type Query{
    queryAllThreedeeperQuestions:[ThreeDeeperQuestionData]
  }
  type Mutation{
    querygptbulkquestions5(
        field: String
        description: String
    ):[ThreeDeeperQuestionReturn]
    createThreeDeeperQuestion(
    questionSet:[String]
    answer:String
    field:String
    tags:[String]
    creatorId:String
    ):ThreeDeeperQuestionData
  }
`;

const ThreeDeeperQuestionsResolvers={
    Query:{
        queryAllThreedeeperQuestions:async()=>{
            return await threedeeperquestions.aggregate([
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
                        questionSet:1,
                        answer:1,
                        field:1,
                        dateAdded:1,
                        tags:1,
                    },
                },
            ]);
        },
    },
    Mutation:{
        querygptbulkquestions5:async(_source: any, _args: any)=>{
            const prompt = `
            Give me an array as stringified json without break lines and without the ' quotes of the array of 5 objects containing multiple questions about 
            ${_args.field} whith this description:${_args.description}
            , so the object will have 1.question:string ,2.options:[string] which contains array of 1 correct answer and 3 incorrect answer , 3. correctAnswer:string , 4.field which will be ${_args.field} and 5. tags: array of one word strings of tags you think this question can have`;
            return gptquestionshandler(prompt);
        },
        createThreeDeeperQuestion:async(_source: any, _args: any)=>{
            const newthreedeeperQuestion=await threedeeperquestions.create(
                {
                    ..._args,
                    dateAdded:new Date(),
                }
            );
            newthreedeeperQuestion.save();
        },

    },
};

export { ThreeDeeperQuestionsTypedefs, ThreeDeeperQuestionsResolvers };
