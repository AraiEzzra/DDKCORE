import SocketRepository from 'core/repository/socket';
import { Peer } from 'shared/model/peer';
import { Block, BlockModel } from 'shared/model/block';
import { Transaction } from 'shared/model/transaction';
import PeerRepository from 'core/repository/peer';
import SystemRepository from 'core/repository/system';
import SharedTransactionRepo from 'shared/repository/transaction';
import config from 'shared/config';
import { ResponseEntity } from 'shared/model/response';
import BlockService from 'core/service/block';
import { logger } from 'shared/util/logger';
import { BlockData, BlockLimit } from 'shared/model/types';

export const ERROR_NOT_ENOUGH_PEERS = 'ERROR_NOT_ENOUGH_PEERS';
export const ERROR_ALL_PEERS_ARE_BANNED = 'ERROR_ALL_PEERS_ARE_BANNED';

interface ISyncRepo {

    sendPeers(peer: Peer, queryId): void;

    requestCommonBlocks(blockData: BlockData, peer: Peer):
        Promise<ResponseEntity<{ isExist: boolean }>>;

    sendCommonBlocksExist(response, peer: Peer, requestId: string): void;

    requestBlocks(data: { height: number, limit: number }, peer): Promise<ResponseEntity<Array<Block>>>;

    sendBlocks(blocks: Array<Block>, peer, requestId: string): void;

    sendHeaders(headers): void;
}

export class Sync implements ISyncRepo {

    async discoverPeers(): Promise<Map<string, object>> {
        const randomPeers = PeerRepository.getRandomPeers(config.CONSTANTS.PEERS_COUNT_FOR_DISCOVER);

        const peersPromises = randomPeers.map(peer => {
            return SocketRepository.peerRPCRequest('REQUEST_PEERS', {}, peer);
        });

        const peersResponses = await Promise.all(peersPromises);
        const result = new Map();
        peersResponses.forEach((response: ResponseEntity<Array<Peer>>) => {
            if (response.success) {
                response.data.forEach(peer => {
                    result.set(`${peer.ip}:${peer.port}`, peer);
                });
            }
        });
        return result;
    }

    sendPeers(peer: Peer, requestId): void {
        const peers = PeerRepository.peerList().map(item => ({
                ip: item.ip,
                port: item.port,
                peerCount: item.peerCount
            })
        );

        SocketRepository.peerRPCResponse('RESPONSE_PEERS', peers, peer, requestId);
    }

    async requestCommonBlocks(blockData: BlockData, peer: Peer):
        Promise<ResponseEntity<{ isExist: boolean }>> {

        const response = await SocketRepository.peerRPCRequest<{ isExist: boolean }>(
            'REQUEST_COMMON_BLOCKS',
            { block: blockData },
            peer
        );

        if (!response.success) {
            return new ResponseEntity(
                { errors: response.errors }
            );
        }
        return new ResponseEntity({ data: { isExist: response.data.isExist } });
    }

    sendCommonBlocksExist(response, peer, requestId): void {
        SocketRepository.peerRPCResponse('RESPONSE_COMMON_BLOCKS', response, peer, requestId);
    }

    async requestBlocks(data: BlockLimit, peer):
        Promise<ResponseEntity<Array<Block>>> {
        const blocksResponse = await SocketRepository.peerRPCRequest<Array<BlockModel>>('REQUEST_BLOCKS', data, peer);
        if (blocksResponse.success) {
            const blocks = blocksResponse.data.map(blockModel => {
                const block = new Block(blockModel);
                block.transactions = block.transactions.map(trs => SharedTransactionRepo.deserialize(trs));
                return block;
            });

            for (const block of blocksResponse.data) {
                const validateResponse = BlockService.validate(block);
                if (!validateResponse.success) {
                    return new ResponseEntity({
                        errors: [
                            `[Repository][Sync][requestBlocks] Block not valid: ${validateResponse.errors}`
                        ]
                    });
                }
            }

            return new ResponseEntity({ data: blocks });
        }
        return new ResponseEntity({ errors: blocksResponse.errors });
    }

    // TODO add SharedBlockRepo serialize
    sendBlocks(blocks: Array<Block>, peer, requestId): void {
        const serializedBlocks: Array<Block & { transactions?: any }> = blocks.map(block => block.getCopy());
        serializedBlocks.forEach(block => {
            block.transactions = block.transactions.map(trs => SharedTransactionRepo.serialize(trs));
        });
        SocketRepository.peerRPCResponse('RESPONSE_BLOCKS', serializedBlocks, peer, requestId);
    }

    sendHeaders(headers) {
        SocketRepository.broadcastPeers('PEER_HEADERS_UPDATE', headers);
    }
}

export default new Sync();
