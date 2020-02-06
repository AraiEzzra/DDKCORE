import DDKRegistry from 'ddk.registry';
import { Feature } from 'ddk.registry/dist/model/common/feature';
import BlockRepository from 'core/repository/block';

export const isFeatureEnabled = (feature: Feature, blockHeight?: number): boolean => {
    const height = blockHeight === undefined
        ? (BlockRepository.getLastBlock() || { height: 0 }).height
        : blockHeight;

    return DDKRegistry.isFeatureEnabled(feature, height);
};

export const isARPEnabled = (): boolean => isFeatureEnabled(Feature.ARP);
