import { Round, Slots } from 'shared/model/round';

const slots: Slots = {
        '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a': 1,
        '6e044df2a479ef728bde085ada32cbc4c2b4b078e4f8c0456f50994586048478': 2,
        'bdb6f3ee251096c395016ba25edf420c4a381dcfc0005241f924f46688541e21': 3,
        'bfae604a708b7b8a036ac638c6896cd8afb620f5b0bf91dcc03d1eddf370f61b': 4,
        '251df69f603a951836667f849787f87f49eb66eb2fa5ad221e09e9c0808ce004': 5
    };

export const getCurrentRound = (): Round => {
    return new Round({
        startHeight: Date.now(),
        endHeight: Date.now() + 50000,
        slots: slots
    });
};

