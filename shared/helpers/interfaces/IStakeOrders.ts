
export interface IStakeOrdersModel {
    id: number;
    stakeId: number;
    status: number;
    startTime: number;
    insertTime: number;
    senderId: string;
    recipientId: string;
    freezedAmount?: bigint;
    rewardCount?: number;
    voteCount?: number;
    nextVoteMilestone?: number;
    isVoteDone?: boolean;
    transferCount?: number;
    airdropReward?: any;
}