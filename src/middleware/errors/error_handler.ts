import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler} from "express"

export const errorHandler: ErrorRequestHandler = (err: any, req: Request, res: Response) => {
    let errCode = err.errCode || err.status || 500;

    if (errCode < 400){
        errCode = 500;
    }

    res.statusCode = errCode;

    const body = {
        errCode: errCode,
        name: err.name,
        message: err.message,
        extraParams: err.extraParams
    };

    if (errCode >= 500) {
        console.error(err.stack || '');
    }

    console.error(JSON.stringify(body));
    
    res.json(body);
}

export default errorHandler;