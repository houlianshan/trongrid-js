import * as accounts from './accounts';
import * as base58 from './base58';
import * as bytes from './bytes';
import * as crypto from './crypto';
import * as code from './code';
import * as abi from './abi';

import validator from 'validator';
import BigNumber from 'bignumber.js';
import TronWeb from "tronweb";

const NET = {
    MAIN: "main",
    TEST: "test"
};

const nets = {
    main: {
        name: "main",
        fullNode: "https://api.trongrid.io",
        solidityNode: "https://api.trongrid.io",
        eventServer: "https://api.trongrid.io",
        defaultAddress: "4142232FF1BDDD5F01C948C9A661E43308648CFEB2"
    },
    test: {
        name: "test",
        fullNode: "https://api.shasta.trongrid.io",
        solidityNode: "https://api.shasta.trongrid.io",
        eventServer: "https://api.shasta.trongrid.io",
        defaultAddress: "41928C9AF0651632157EF27A2CF17CA72C575A4D21"
    }
};

module.exports = nets;

const utils = {
    isValidURL(url) {
        if(typeof url !== 'string')
            return false;
        return validator.isURL(url.toString(), {
            protocols: ['http', 'https']
        });
    },

    isObject(obj) {
        return obj === Object(obj) && Object.prototype.toString.call(obj) !== '[object Array]';
    },

    isArray(array) {
        return Array.isArray(array);
    },

    isJson(string) {
        try {
            return !!JSON.parse(string);
        } catch (ex) {
            return false;
        }
    },

    isBoolean(bool) {
        return typeof bool === 'boolean';
    },

    isBigNumber(number) {
        return number && (number instanceof BigNumber || (number.constructor && number.constructor.name === 'BigNumber'));
    },

    isString(string) {
        return typeof string === 'string' || (string && string.constructor && string.constructor.name === 'String');
    },

    isFunction(obj) {
        return typeof obj === 'function';
    },

    isHex(string) {
        return (typeof string === 'string'
            && !isNaN(parseInt(string, 16))
            && /^(0x|)[a-fA-F0-9]+$/.test(string));
    },

    isInteger(number) {
        if(number === null)
            return false
        return Number.isInteger(
            Number(number)
        );
    },

    hasProperty(obj, property) {
        return Object.prototype.hasOwnProperty.call(obj, property);
    },

    hasProperties(obj, ...properties) {
        return properties.length && !properties.map(property => {
            return this.hasProperty(obj, property)
        }).includes(false);
    },

    injectPromise(func, ...args) {
        return new Promise((resolve, reject) => {
            func(...args, (err, res) => {
                if(err)
                    reject(err);
                else resolve(res);
            });
        });
    },

    promiseInjector(scope) {
        return (func, ...args) => {
            return this.injectPromise(func.bind(scope), ...args);
        }
    },

    mapEvent(event) {
        return {
            block: event.block_number,
            timestamp: event.block_timestamp,
            contract: event.contract_address,
            name: event.event_name,
            transaction: event.transaction_id,
            result: event.result,
            resourceNode: event.resource_Node
        };
    },

    parseEvent(event, {inputs: abi}) {
        if(!event.result)
            return event;

        if(this.isObject(event.result)) {
            for(var i = 0; i < abi.length; i++) {
                let obj = abi[i];
                if(obj.type == 'address' && obj.name in event.result)
                    event.result[obj.name] = '41' + event.result[obj.name].substr(2).toLowerCase();
            }
        } else if(this.isArray(event.result)) {
            event.result = event.result.reduce((obj, result, index) => {
                const {
                    name,
                    type
                } = abi[index];

                if(type == 'address')
                    result = '41' + result.substr(2).toLowerCase();

                obj[name] = result;

                return obj;
            }, {});
        }

        return event;
    },

    padLeft(input, padding, amount) {
        let res = input.toString();

        while (res.length < amount)
            res = padding + res;

        return res;
    },

    isNotNullOrUndefined(val) {
        return val !== null && typeof val !== 'undefined';
    },

    configureNet(net) {
        let tronweb;
        let defaultAddress;

        if (typeof net === 'object') {
            tronweb = new TronWeb(
                net.fullNode,
                net.solidityNode,
                net.eventServer
            );
            defaultAddress = net.defaultAddress;
        }
        else {
            switch (net) {
                case NET.MAIN:
                    tronweb = new TronWeb(
                        nets.main.fullNode,
                        nets.main.solidityNode,
                        nets.main.eventServer
                    );
                    defaultAddress = nets.main.defaultAddress;
                    break;
                case NET.TEST:
                    tronweb = new TronWeb(
                        nets.test.fullNode,
                        nets.test.solidityNode,
                        nets.test.eventServer
                    );
                    defaultAddress = nets.test.defaultAddress;
                    break;
                default:
                    throw new Error("Invalid net");
            }
        }

        this.tronweb = tronweb;
        this.defaultAddress = defaultAddress;

        return {
            tronweb: tronweb,
            defaultAddress: defaultAddress
        }
    }
};

export default {
    ...utils,
    code,
    accounts,
    base58,
    bytes,
    crypto,
    abi
};
