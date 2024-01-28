import { gql } from 'apollo-server-express';
import { gptquestionshandler } from '../../../middleware/gptquestionapi';
import fastselectionpairquestion from '../../../models/schemas/fastselectionpairquestion';
const FastSelectionPairTypedefs=gql`
scalar Date
type FastSelectionPairData{
    id:ID
    question:String
    options:[String]
    correctPair:[String]
    field:String
    tags:[String]
    dateAdded:Date
    creator:String
}
type fastselectionPairquestionReturn{
    question:String
    options:[String]
    correctPair:[String]
    tags:[String]
    field:String
  }
type Query{
    queryAllfastselectionpairQuestions:[FastSelectionPairData]

}
type Mutation{
    querygptbulkquestions4(
        field: String
        description: String
    ):[fastselectionPairquestionReturn]
    createFastSelectionPairQuestion(
        question:String
        options:[String]
        correctPair:[String]
        tags:[String]
        field:String
        creatorId:String
    ):FastSelectionPairData
}
`;

const FastSelectionPairResolvers={
    Query:{
        queryAllfastselectionpairQuestions:async()=>{
            return await fastselectionpairquestion.aggregate([
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
                        options:1,
                        correctPair:1,
                        field:1,
                        dateAdded:1,
                        tags:1,
                    },
                },
            ]);
        },
    },
    Mutation:{
        querygptbulkquestions4:async(_source: any, _args: any)=>{
            const prompt = `
            Give me an array as stringified json without break lines and without the ' quotes of the array of 5 objects containing multiple questions about 
            ${_args.field} whith this description:${_args.description}
            , so the object will have 1.question:string ,2.options:[string] which contains array of 1 correct answer and 3 incorrect answer , 3. correctAnswer:string , 4.field which will be ${_args.field} and 5. tags: array of one word strings of tags you think this question can have`;
            return gptquestionshandler(prompt);
        },
        createFastSelectionPairQuestion:async(_source: any, _args: any)=>{
            const FastSelectionPairQuestion=await fastselectionpairquestion.create(
                {
                    ..._args,
                    dateAdded:new Date(),
                }
            );
            FastSelectionPairQuestion.save();
        },
    },
};

export { FastSelectionPairResolvers, FastSelectionPairTypedefs };
