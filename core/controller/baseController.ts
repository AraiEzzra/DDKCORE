
export class BaseController {
    eventsON: Array<any>;
    eventsRPC: Array<any>;
    eventsMAIN: { [topicName: string]: Function };
}
