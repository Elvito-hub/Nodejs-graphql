import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const auth = (req: Request, res: Response, next: NextFunction)=>{
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ errorMessage:'Unauthorized' });
        }

        const verified = jwt.verify(token, `${process.env.JWT_SECRET_KEY}`) as {id: string};
        // @ts-ignore
        req.user = verified.id;
    } catch (error) {
        return res.status(401).json({ errorMessage:'Unauthorized' });
    }
};

export default auth;
