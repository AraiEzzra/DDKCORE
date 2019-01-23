export class StakeOrder {
    id: string;
    stakeId: number;
    status: number;
    startTime: number;
    insertTime: number;
    senderId: string;
    recipientId: string;
    freezedAmount: number;
    rewardCount: number;
    voteCount: number;
    nextVoteMilestone: number;
    isVoteDone: boolean;
    isTransferred: number;
    airdropReward: string;    

    constructor(rawData: any) {
        this.id = rawData.id;
        this.stakeId = Number(rawData.stakeId);
        this.status = Number(rawData.status);
        this.startTime = Number(rawData.startTime);
        this.insertTime = Number(rawData.insertTime);
        this.senderId = rawData.senderId;
        this.recipientId = rawData.recipientId;
        this.freezedAmount = Number(rawData.freezedAmount);
        this.rewardCount = Number(rawData.rewardCount);
        this.voteCount = Number(rawData.voteCount);
        this.nextVoteMilestone = Number(rawData.nextVoteMilestone);
        this.isVoteDone = rawData.isVoteDone;
        this.isTransferred = Number(rawData.isTransferred);
        this.airdropReward = rawData.airdropReward;
    }
}
