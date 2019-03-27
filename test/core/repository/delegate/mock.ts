let delegateIdSequence = 0;
export const getNewDelegateName = () => {
    delegateIdSequence++;
    return 'user' + delegateIdSequence;
};
