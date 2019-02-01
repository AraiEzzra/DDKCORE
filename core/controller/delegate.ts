import Response from 'shared/model/response';
import { Controller } from '../util/decorator';

@Controller('/delegate')
export class DelegateController {

    @ON('some_event')
    onBlockchainReadyForForging(): Response<boolean> {
        return new Response({
            data: true
        });
    }
}
