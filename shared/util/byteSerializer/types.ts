import { Int8 } from './models/int8';
import { Uint8 } from './models/uint8';
import { Int16 } from './models/int16';
import { Uint16 } from './models/uint16';
import { Int32 } from './models/int32';
import { Uint32 } from './models/uint32';
import { Uint64 } from './models/uint64';
import { Double } from './models/double';
import { Utf8 } from './models/utf8';
import { BufferArray } from './models/array';
import { BufferObject } from './models/object';
import { DynamicBuffer } from './models/dynamicBuffer';
import { BufferMap } from './models/map';
import { BufferSet } from './models/set';
import { Bool } from './models/boolean';
import { Number64 } from './models/number64';

export const BufferTypes = {
    Int8,
    Uint8,
    Int16,
    Uint16,
    Int32,
    Uint32,
    Uint64,
    Double,
    Utf8,
    Array: BufferArray,
    Object: BufferObject,
    Buffer: DynamicBuffer,
    Set: BufferSet,
    Map: BufferMap,
    Boolean: Bool,
    Number64,
};

export enum BufferTypesId {
    Int8,
    Uint8,
    Int16,
    Uint16,
    Int32,
    Uint32,
    Uint64,
    Double,
    Utf8,
    BufferArray,
    BufferObject,
    BufferSet,
    BufferMap,
    Bool,
    Number64,
}

export const mapPrimitiveCode = new Map();

mapPrimitiveCode.set(BufferTypesId.Int8, Int8);
mapPrimitiveCode.set(BufferTypesId.Uint8, Uint8);
mapPrimitiveCode.set(BufferTypesId.Int16, Int16);
mapPrimitiveCode.set(BufferTypesId.Uint16, Uint16);
mapPrimitiveCode.set(BufferTypesId.Int32, Int32);
mapPrimitiveCode.set(BufferTypesId.Uint32, Uint32);
mapPrimitiveCode.set(BufferTypesId.Uint64, Uint64);
mapPrimitiveCode.set(BufferTypesId.Double, Double);
mapPrimitiveCode.set(BufferTypesId.Utf8, Utf8);
mapPrimitiveCode.set(BufferTypesId.BufferArray, BufferArray);
mapPrimitiveCode.set(BufferTypesId.BufferObject, BufferObject);
mapPrimitiveCode.set(BufferTypesId.BufferSet, BufferSet);
mapPrimitiveCode.set(BufferTypesId.BufferMap, BufferMap);
mapPrimitiveCode.set(BufferTypesId.Bool, Bool);
mapPrimitiveCode.set(BufferTypesId.Number64, Number64);
