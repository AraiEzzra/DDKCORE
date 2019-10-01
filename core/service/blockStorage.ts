import BlockRepository from 'core/repository/block';
import TransactionRepository from 'core/repository/transaction';
import BlockPGRepository from 'core/repository/block/pg';
import { Block } from 'shared/model/block';
import { BlockId } from 'shared/repository/block';
import { ResponseEntity } from 'shared/model/response';
import { BlockHeadersStorage } from 'core/repository/storage/blockHeaders';
import { BlockHeaders } from 'shared/model/headers/block';

const MEMORY_BLOCKS_LIMIT = 1000;

class BlockStorageService {
    cleanup() {
        while (BlockRepository.size > MEMORY_BLOCKS_LIMIT) {
            const removedBlock = BlockRepository.deleteFirst();
            if (!removedBlock) {
                return;
            }

            removedBlock.transactions.forEach(transaction => TransactionRepository.delete(transaction.id));
        }
    }

    push(block: Block) {
        BlockRepository.add(block);
        BlockHeadersStorage.set(block.id, { id: block.id, height: block.height });

        if (BlockRepository.size > MEMORY_BLOCKS_LIMIT) {
            this.cleanup();
        }
    }

    getGenesis(): Block {
        return BlockRepository.getGenesisBlock();
    }

    getLast(): Block {
        return BlockRepository.getLastBlock();
    }

    popLast(): Block {
        return BlockRepository.deleteLastBlock();
    }

    pop(): Block {
        const blockForRemove = BlockRepository.getLastBlock();
        const newLastBlock = BlockRepository.deleteLastBlock();

        BlockHeadersStorage.delete(blockForRemove.id);

        return newLastBlock;
    }

    has(id: BlockId): boolean {
        return BlockHeadersStorage.has(id);
    }

    async getById(id: BlockId): Promise<Block> {
        const block = BlockRepository.getById(id);
        if (block) {
            return block;
        }

        return BlockPGRepository.getById(id);
    }

    getHeaders(id: BlockId): BlockHeaders {
        return BlockHeadersStorage.get(id);
    }

    async getMany(limit: number, offset: number = 0): Promise<ResponseEntity<Array<Block>>> {
        const blocks = BlockRepository.getMany(limit, offset);
        if (blocks.length) {
            return new ResponseEntity({ data: blocks });
        }

        return BlockPGRepository.getMany(limit, offset);
    }
}

export default new BlockStorageService();
