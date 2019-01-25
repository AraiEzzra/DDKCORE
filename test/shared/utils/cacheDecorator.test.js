"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var cacheDecorator_1 = require("../../../shared/util/cacheDecorator");
var chai_1 = require("chai");
var RedisClient = (function () {
    function RedisClient() {
        this.isConnected = false;
        this.store = [];
        this.isConnected = true;
    }
    RedisClient.prototype.get = function (key) {
        console.log('Try to get ', key);
        return this.store[key];
    };
    RedisClient.prototype.set = function (key, value) {
        console.log('Try to set ', key, value);
        this.store[key] = value;
        if (this.store[key]) {
            return true;
        }
    };
    return RedisClient;
}());
var redisClient = new RedisClient();
describe('Mock redis', function () {
    it('Client set :: ', function () {
        chai_1.expect(redisClient.set('test', 'test')).to.equal(true);
    });
    it('Client get ::', function () {
        chai_1.expect(redisClient.get('test')).to.equal('test');
    });
});
var TestDecorator = (function () {
    function TestDecorator() {
    }
    TestDecorator.prototype.method = function () {
        return 7;
    };
    TestDecorator.prototype.method2 = function () {
        return 2;
    };
    __decorate([
        cacheDecorator_1.useCache(500, redisClient)
    ], TestDecorator.prototype, "method", null);
    __decorate([
        cacheDecorator_1.useCache(2, redisClient)
    ], TestDecorator.prototype, "method2", null);
    return TestDecorator;
}());
var test = new TestDecorator();
console.log('test', test);
describe('Cache Decorator', function () {
    it('Set test', function () {
        chai_1.expect(test.method()).to.equal(7);
    });
    it('Set test', function () {
        chai_1.expect(test.method2()).to.equal(2);
    });
});
