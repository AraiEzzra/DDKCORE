import { Message } from 'shared/model/message';

export const getId = (message: Message): string => message.headers.id;
export const getBody = (message: Message): any => message.body;
export const getCode = (message: Message): string => message.code;



