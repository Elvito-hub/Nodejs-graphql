import crypto from 'crypto';

export const encryptCorrectAnswers=(resultObj: any, secretKey: any)=> {
    const encryptedResult = resultObj;

    // Iterate over each multipleQuestion object
    encryptedResult.multipleQuestion = encryptedResult.multipleQuestion.map((question: any) => {
        const encryptedAnswers = question.correctAnswer.map((answer: any) => {
            const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, Buffer.alloc(16));
            let encryptedAnswer = cipher.update(answer, 'utf8', 'hex');
            encryptedAnswer += cipher.final('hex');
            return encryptedAnswer;
        });

        return { ...question, correctAnswer: encryptedAnswers };
    });
    encryptedResult.typingQuestion = encryptedResult.typingQuestion.map((question: any) => {
        let floated='';
        for (let i=0; i<question.answer.length;i++){
            if(question.answer[i]!==' '){
                floated+=`${i%10}`;
            }else{
                floated+=' ';
            }
        }
        const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, Buffer.alloc(16));
        let encryptedAnswer = cipher.update(question.answer, 'utf8', 'hex');
        encryptedAnswer += cipher.final('hex');
        return { ...question, answer: encryptedAnswer, floated };
    });

    return encryptedResult;
};
