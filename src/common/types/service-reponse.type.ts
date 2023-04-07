type ServiceResponseType<T> = {
    data: T|T[];
    meta?: {
        page?: number,
        limit?: number,
        skip?: number,
        count?: number
    };
    message?: string;
    error?: string;
    statusCode?:number;
    [key: string]: any;
}