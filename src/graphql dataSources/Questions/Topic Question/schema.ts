import { gql } from 'apollo-server-express';
import { gptquestionshandler } from '../../../middleware/gptquestionapi';
import topicquestion from '../../../models/schemas/topicquestion';

const TopicQuestionTypedefs=gql`
scalar Date
type TopicQuestionData{
    id:ID
    topic:String
    question:String
    answer:String
    dateAdded:Date
    questionFiles:[String]
    creator:String
}
type Query{
    getAllTopicQuestions:[TopicQuestionData]
}
type Mutation{
    querygptbulkquestions2(
        field: String
        description: String
    ):[TopicQuestionData]
    createTopicQuestion(
        topic:String
        question:String
        answer:String
        questionFiles:[String]
        tags:[String]
        creatorId:String
    ):TopicQuestionData
}
`;

const TopicQuestionResolvers = {
    Query:{
        getAllTopicQuestions:async()=>{
            return await topicquestion.aggregate([
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
                        topic:1,
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
        querygptbulkquestions2:async(_source: any, _args: any)=>{
            const prompt = `
            Give me an array as stringified json without break lines and without the ' quotes of the array of 5 objects containing multiple questions about 
            ${_args.field} whith this description:${_args.description}
            , so the object will have 1.question:string ,2.options:[string] which contains array of 1 correct answer and 3 incorrect answer , 3. correctAnswer:string , 4.field which will be ${_args.field} and 5. tags: array of one word strings of tags you think this question can have`;
            return gptquestionshandler(prompt);
        },
        createTopicQuestion:async(_source: any, _args: any)=>{
            const newTopicQuestion=await topicquestion.create(
                {
                    ..._args,
                    dateAdded:new Date(),
                }
            );
            newTopicQuestion.save();
        },
    },
};

export { TopicQuestionTypedefs, TopicQuestionResolvers };
