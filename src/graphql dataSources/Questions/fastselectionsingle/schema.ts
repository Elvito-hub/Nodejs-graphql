import { gql } from 'apollo-server-express';
import { gptquestionshandler } from '../../../middleware/gptquestionapi';
import fastselectionsinglequestion from '../../../models/schemas/fastselectionsinglequestion';

const FastSelectionSingleTypedefs=gql`
scalar Date
type FastSelectionSingleData{
    id:ID
    question:String
    options:[String]
    correctOptions:[String]
    field:String
    tags:[String]
    dateAdded:Date
    creator:String
}
type fastselectionSinglequestionReturn{
    question:String
    options:[String]
    correctOptions:[String]
    tags:[String]
    field:String
  }
type Query{
    queryAllfastselectionsingleQuestions:[FastSelectionSingleData]
}
type Mutation{
    querygptbulkquestions3(
        field: String
        description: String
    ):[fastselectionSinglequestionReturn]
    createFastSelectionSingleQuestion(
        question:String
        options:[String]
        correctOptions:[String]
        tags:[String]
        field:String
        creatorId:String
    ):FastSelectionSingleData
}
`;

const FastSelectionSingleResolvers={
    Query:{
        queryAllfastselectionsingleQuestions:async()=>{
            return await fastselectionsinglequestion.aggregate([
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
                        correctOptions:1,
                        field:1,
                        dateAdded:1,
                        tags:1,
                    },
                },
            ]);
        },
    },
    Mutation:{
        querygptbulkquestions3:async(_source: any, _args: any)=>{
            const prompt = `
            Give me an array as stringified json without break lines and without the ' quotes of the array of 1 object containing a list of a lot things that I should select the correct ones, example a list of countries and I have select countries from Europe, The question should be about ${_args.field} whith this description:${_args.description}
            , so the object will have 1.question:string ,2.options:[string] which contains a list of all options , 3.correctOptions:[string] list of all correct choices , 4.field:string which will be ${_args.field} and 5. tags: array of one word strings of tags you think this question can have.`;
            return gptquestionshandler(prompt);
        },
        createFastSelectionSingleQuestion:async(_source: any, _args: any)=>{
            const FastSelectionSingleQuestion=await fastselectionsinglequestion.create(
                {
                    ..._args,
                    dateAdded:new Date(),
                }
            );
            FastSelectionSingleQuestion.save();
        },
    },
};

export { FastSelectionSingleTypedefs, FastSelectionSingleResolvers };
