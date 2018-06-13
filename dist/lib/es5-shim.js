/*!
 * https://github.com/es-shims/es5-shim
 * @license es5-shim Copyright 2009-2015 by contributors, MIT License
 * see https://github.com/es-shims/es5-shim/blob/master/LICENSE
 */

// vim: ts=4 sts=4 sw=4 expandtab

// Add semicolon to prevent IIFE from being passed as argument to concatenated code.


// UMD (Universal Module Definition)
// see https://github.com/umdjs/umd/blob/master/templates/returnExports.js
(function (root, factory) {
	

	/* global define, exports, module */
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like enviroments that support module.exports,
		// like Node.
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root.returnExports = factory();
	}
}(this, function () {
	/**
     * Brings an environment as close to ECMAScript 5 compliance
     * as is possible with the facilities of erstwhile engines.
     *
     * Annotated ES5: http://es5.github.com/ (specific links below)
     * ES5 Spec: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf
     * Required reading: http://javascriptweblog.wordpress.com/2011/12/05/extending-javascript-natives/
     */

	// Shortcut to an often accessed properties, in order to avoid multiple
	// dereference that costs universally. This also holds a reference to known-good
	// functions.
	let $Array = Array;
	let ArrayPrototype = $Array.prototype;
	let $Object = Object;
	let ObjectPrototype = $Object.prototype;
	let $Function = Function;
	let FunctionPrototype = $Function.prototype;
	let $String = String;
	let StringPrototype = $String.prototype;
	let $Number = Number;
	let NumberPrototype = $Number.prototype;
	let array_slice = ArrayPrototype.slice;
	let array_splice = ArrayPrototype.splice;
	let array_push = ArrayPrototype.push;
	let array_unshift = ArrayPrototype.unshift;
	let array_concat = ArrayPrototype.concat;
	let array_join = ArrayPrototype.join;
	let call = FunctionPrototype.call;
	let apply = FunctionPrototype.apply;
	let max = Math.max;
	let min = Math.min;

	// Having a toString local variable name breaks in Opera so use to_string.
	let to_string = ObjectPrototype.toString;

	/* global Symbol */
	/* eslint-disable one-let-declaration-per-line, no-redeclare, max-statements-per-line */
	let hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
	let isCallable; /* inlined from https://npmjs.com/is-callable */ let fnToStr = Function.prototype.toString, constructorRegex = /^\s*class /, isES6ClassFn = function isES6ClassFn(value) { try { let fnStr = fnToStr.call(value); let singleStripped = fnStr.replace(/\/\/.*\n/g, ''); let multiStripped = singleStripped.replace(/\/\*[.\s\S]*\*\//g, ''); let spaceStripped = multiStripped.replace(/\n/mg, ' ').replace(/ {2}/g, ' '); return constructorRegex.test(spaceStripped); } catch (e) { return false; /* not a function */ } }, tryFunctionObject = function tryFunctionObject(value) { try { if (isES6ClassFn(value)) { return false; } fnToStr.call(value); return true; } catch (e) { return false; } }, fnClass = '[object Function]', genClass = '[object GeneratorFunction]', isCallable = function isCallable(value) { if (!value) { return false; } if (typeof value !== 'function' && typeof value !== 'object') { return false; } if (hasToStringTag) { return tryFunctionObject(value); } if (isES6ClassFn(value)) { return false; } let strClass = to_string.call(value); return strClass === fnClass || strClass === genClass; };

	let isRegex; /* inlined from https://npmjs.com/is-regex */ let regexExec = RegExp.prototype.exec, tryRegexExec = function tryRegexExec(value) { try { regexExec.call(value); return true; } catch (e) { return false; } }, regexClass = '[object RegExp]'; isRegex = function isRegex(value) { if (typeof value !== 'object') { return false; } return hasToStringTag ? tryRegexExec(value) : to_string.call(value) === regexClass; };
	let isString; /* inlined from https://npmjs.com/is-string */ let strValue = String.prototype.valueOf, tryStringObject = function tryStringObject(value) { try { strValue.call(value); return true; } catch (e) { return false; } }, stringClass = '[object String]'; isString = function isString(value) { if (typeof value === 'string') { return true; } if (typeof value !== 'object') { return false; } return hasToStringTag ? tryStringObject(value) : to_string.call(value) === stringClass; };
	/* eslint-enable one-let-declaration-per-line, no-redeclare, max-statements-per-line */

	/* inlined from http://npmjs.com/define-properties */
	let supportsDescriptors = $Object.defineProperty && (function () {
		try {
			let obj = {};
			$Object.defineProperty(obj, 'x', { enumerable: false, value: obj });
			for (let _ in obj) { // jscs:ignore disallowUnusedVariables
				return false;
			}
			return obj.x === obj;
		} catch (e) { /* this is ES3 */
			return false;
		}
	}());
	let defineProperties = (function (has) {
		// Define configurable, writable, and non-enumerable props
		// if they don't exist.
		let defineProperty;
		if (supportsDescriptors) {
			defineProperty = function (object, name, method, forceAssign) {
				if (!forceAssign && (name in object)) {
					return;
				}
				$Object.defineProperty(object, name, {
					configurable: true,
					enumerable: false,
					writable: true,
					value: method
				});
			};
		} else {
			defineProperty = function (object, name, method, forceAssign) {
				if (!forceAssign && (name in object)) {
					return;
				}
				object[name] = method;
			};
		}
		return function defineProperties(object, map, forceAssign) {
			for (let name in map) {
				if (has.call(map, name)) {
					defineProperty(object, name, map[name], forceAssign);
				}
			}
		};
	}(ObjectPrototype.hasOwnProperty));

	//
	// Util
	// ======
	//

	/* replaceable with https://npmjs.com/package/es-abstract /helpers/isPrimitive */
	let isPrimitive = function isPrimitive(input) {
		let type = typeof input;
		return input === null || (type !== 'object' && type !== 'function');
	};

	let isActualNaN = $Number.isNaN || function isActualNaN(x) {
		return x !== x;
	};

	let ES = {
		// ES5 9.4
		// http://es5.github.com/#x9.4
		// http://jsperf.com/to-integer
		/* replaceable with https://npmjs.com/package/es-abstract ES5.ToInteger */
		ToInteger: function ToInteger(num) {
			let n = +num;
			if (isActualNaN(n)) {
				n = 0;
			} else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) {
				n = (n > 0 || -1) * Math.floor(Math.abs(n));
			}
			return n;
		},

		/* replaceable with https://npmjs.com/package/es-abstract ES5.ToPrimitive */
		ToPrimitive: function ToPrimitive(input) {
			let val, valueOf, toStr;
			if (isPrimitive(input)) {
				return input;
			}
			valueOf = input.valueOf;
			if (isCallable(valueOf)) {
				val = valueOf.call(input);
				if (isPrimitive(val)) {
					return val;
				}
			}
			toStr = input.toString;
			if (isCallable(toStr)) {
				val = toStr.call(input);
				if (isPrimitive(val)) {
					return val;
				}
			}
			throw new TypeError();
		},

		// ES5 9.9
		// http://es5.github.com/#x9.9
		/* replaceable with https://npmjs.com/package/es-abstract ES5.ToObject */
		ToObject: function (o) {
			if (o == null) { // this matches both null and undefined
				throw new TypeError('can\'t convert ' + o + ' to object');
			}
			return $Object(o);
		},

		/* replaceable with https://npmjs.com/package/es-abstract ES5.ToUint32 */
		ToUint32: function ToUint32(x) {
			return x >>> 0;
		}
	};

	//
	// Function
	// ========
	//

	// ES-5 15.3.4.5
	// http://es5.github.com/#x15.3.4.5

	let Empty = function Empty() {};

	defineProperties(FunctionPrototype, {
		bind: function bind(that) { // .length is 1
			// 1. Let Target be the this value.
			let target = this;
			// 2. If IsCallable(Target) is false, throw a TypeError exception.
			if (!isCallable(target)) {
				throw new TypeError('Function.prototype.bind called on incompatible ' + target);
			}
			// 3. Let A be a new (possibly empty) internal list of all of the
			//   argument values provided after thisArg (arg1, arg2 etc), in order.
			// XXX slicedArgs will stand in for "A" if used
			let args = array_slice.call(arguments, 1); // for normal call
			// 4. Let F be a new native ECMAScript object.
			// 11. Set the [[Prototype]] internal property of F to the standard
			//   built-in Function prototype object as specified in 15.3.3.1.
			// 12. Set the [[Call]] internal property of F as described in
			//   15.3.4.5.1.
			// 13. Set the [[Construct]] internal property of F as described in
			//   15.3.4.5.2.
			// 14. Set the [[HasInstance]] internal property of F as described in
			//   15.3.4.5.3.
			let bound;
			let binder = function () {

				if (this instanceof bound) {
					// 15.3.4.5.2 [[Construct]]
					// When the [[Construct]] internal method of a function object,
					// F that was created using the bind function is called with a
					// list of arguments ExtraArgs, the following steps are taken:
					// 1. Let target be the value of F's [[TargetFunction]]
					//   internal property.
					// 2. If target has no [[Construct]] internal method, a
					//   TypeError exception is thrown.
					// 3. Let boundArgs be the value of F's [[BoundArgs]] internal
					//   property.
					// 4. Let args be a new list containing the same values as the
					//   list boundArgs in the same order followed by the same
					//   values as the list ExtraArgs in the same order.
					// 5. Return the result of calling the [[Construct]] internal
					//   method of target providing args as the arguments.

					let result = apply.call(
						target,
						this,
						array_concat.call(args, array_slice.call(arguments))
					);
					if ($Object(result) === result) {
						return result;
					}
					return this;

				} else {
					// 15.3.4.5.1 [[Call]]
					// When the [[Call]] internal method of a function object, F,
					// which was created using the bind function is called with a
					// this value and a list of arguments ExtraArgs, the following
					// steps are taken:
					// 1. Let boundArgs be the value of F's [[BoundArgs]] internal
					//   property.
					// 2. Let boundThis be the value of F's [[BoundThis]] internal
					//   property.
					// 3. Let target be the value of F's [[TargetFunction]] internal
					//   property.
					// 4. Let args be a new list containing the same values as the
					//   list boundArgs in the same order followed by the same
					//   values as the list ExtraArgs in the same order.
					// 5. Return the result of calling the [[Call]] internal method
					//   of target providing boundThis as the this value and
					//   providing args as the arguments.

					// equiv: target.call(this, ...boundArgs, ...args)
					return apply.call(
						target,
						that,
						array_concat.call(args, array_slice.call(arguments))
					);

				}

			};

			// 15. If the [[Class]] internal property of Target is "Function", then
			//     a. Let L be the length property of Target minus the length of A.
			//     b. Set the length own property of F to either 0 or L, whichever is
			//       larger.
			// 16. Else set the length own property of F to 0.

			let boundLength = max(0, target.length - args.length);

			// 17. Set the attributes of the length own property of F to the values
			//   specified in 15.3.5.1.
			let boundArgs = [];
			for (let i = 0; i < boundLength; i++) {
				array_push.call(boundArgs, '$' + i);
			}

			// XXX Build a dynamic function with desired amount of arguments is the only
			// way to set the length property of a function.
			// In environments where Content Security Policies enabled (Chrome extensions,
			// for ex.) all use of eval or Function costructor throws an exception.
			// However in all of these environments Function.prototype.bind exists
			// and so this code will never be executed.
			bound = $Function('binder', 'return function (' + array_join.call(boundArgs, ',') + '){ return binder.apply(this, arguments); }')(binder);

			if (target.prototype) {
				Empty.prototype = target.prototype;
				bound.prototype = new Empty();
				// Clean up dangling references.
				Empty.prototype = null;
			}

			// TODO
			// 18. Set the [[Extensible]] internal property of F to true.

			// TODO
			// 19. Let thrower be the [[ThrowTypeError]] function Object (13.2.3).
			// 20. Call the [[DefineOwnProperty]] internal method of F with
			//   arguments "caller", PropertyDescriptor {[[Get]]: thrower, [[Set]]:
			//   thrower, [[Enumerable]]: false, [[Configurable]]: false}, and
			//   false.
			// 21. Call the [[DefineOwnProperty]] internal method of F with
			//   arguments "arguments", PropertyDescriptor {[[Get]]: thrower,
			//   [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false},
			//   and false.

			// TODO
			// NOTE Function objects created using Function.prototype.bind do not
			// have a prototype property or the [[Code]], [[FormalParameters]], and
			// [[Scope]] internal properties.
			// XXX can't delete prototype in pure-js.

			// 22. Return F.
			return bound;
		}
	});

	// _Please note: Shortcuts are defined after `Function.prototype.bind` as we
	// use it in defining shortcuts.
	let owns = call.bind(ObjectPrototype.hasOwnProperty);
	let toStr = call.bind(ObjectPrototype.toString);
	let arraySlice = call.bind(array_slice);
	let arraySliceApply = apply.bind(array_slice);
	let strSlice = call.bind(StringPrototype.slice);
	let strSplit = call.bind(StringPrototype.split);
	let strIndexOf = call.bind(StringPrototype.indexOf);
	let pushCall = call.bind(array_push);
	let isEnum = call.bind(ObjectPrototype.propertyIsEnumerable);
	let arraySort = call.bind(ArrayPrototype.sort);

	//
	// Array
	// =====
	//

	let isArray = $Array.isArray || function isArray(obj) {
		return toStr(obj) === '[object Array]';
	};

	// ES5 15.4.4.12
	// http://es5.github.com/#x15.4.4.13
	// Return len+argCount.
	// [bugfix, ielt8]
	// IE < 8 bug: [].unshift(0) === undefined but should be "1"
	let hasUnshiftReturnValueBug = [].unshift(0) !== 1;
	defineProperties(ArrayPrototype, {
		unshift: function () {
			array_unshift.apply(this, arguments);
			return this.length;
		}
	}, hasUnshiftReturnValueBug);

	// ES5 15.4.3.2
	// http://es5.github.com/#x15.4.3.2
	// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
	defineProperties($Array, { isArray: isArray });

	// The IsCallable() check in the Array functions
	// has been replaced with a strict check on the
	// internal class of the object to trap cases where
	// the provided function was actually a regular
	// expression literal, which in V8 and
	// JavaScriptCore is a typeof "function".  Only in
	// V8 are regular expression literals permitted as
	// reduce parameters, so it is desirable in the
	// general case for the shim to match the more
	// strict and common behavior of rejecting regular
	// expressions.

	// ES5 15.4.4.18
	// http://es5.github.com/#x15.4.4.18
	// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/forEach

	// Check failure of by-index access of string characters (IE < 9)
	// and failure of `0 in boxedString` (Rhino)
	let boxedString = $Object('a');
	let splitString = boxedString[0] !== 'a' || !(0 in boxedString);

	let properlyBoxesContext = function properlyBoxed(method) {
		// Check node 0.6.21 bug where third parameter is not boxed
		let properlyBoxesNonStrict = true;
		let properlyBoxesStrict = true;
		let threwException = false;
		if (method) {
			try {
				method.call('foo', function (_, __, context) {
					if (typeof context !== 'object') {
						properlyBoxesNonStrict = false;
					}
				});

				method.call([1], function () {
					

					properlyBoxesStrict = typeof this === 'string';
				}, 'x');
			} catch (e) {
				threwException = true;
			}
		}
		return !!method && !threwException && properlyBoxesNonStrict && properlyBoxesStrict;
	};

	defineProperties(ArrayPrototype, {
		forEach: function forEach(callbackfn/*, thisArg*/) {
			let object = ES.ToObject(this);
			let self = splitString && isString(this) ? strSplit(this, '') : object;
			let i = -1;
			let length = ES.ToUint32(self.length);
			let T;
			if (arguments.length > 1) {
				T = arguments[1];
			}

			// If no callback function or if callback is not a callable function
			if (!isCallable(callbackfn)) {
				throw new TypeError('Array.prototype.forEach callback must be a function');
			}

			while (++i < length) {
				if (i in self) {
					// Invoke the callback function with call, passing arguments:
					// context, property value, property key, thisArg object
					if (typeof T === 'undefined') {
						callbackfn(self[i], i, object);
					} else {
						callbackfn.call(T, self[i], i, object);
					}
				}
			}
		}
	}, !properlyBoxesContext(ArrayPrototype.forEach));

	// ES5 15.4.4.19
	// http://es5.github.com/#x15.4.4.19
	// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
	defineProperties(ArrayPrototype, {
		map: function map(callbackfn/*, thisArg*/) {
			let object = ES.ToObject(this);
			let self = splitString && isString(this) ? strSplit(this, '') : object;
			let length = ES.ToUint32(self.length);
			let result = $Array(length);
			let T;
			if (arguments.length > 1) {
				T = arguments[1];
			}

			// If no callback function or if callback is not a callable function
			if (!isCallable(callbackfn)) {
				throw new TypeError('Array.prototype.map callback must be a function');
			}

			for (let i = 0; i < length; i++) {
				if (i in self) {
					if (typeof T === 'undefined') {
						result[i] = callbackfn(self[i], i, object);
					} else {
						result[i] = callbackfn.call(T, self[i], i, object);
					}
				}
			}
			return result;
		}
	}, !properlyBoxesContext(ArrayPrototype.map));

	// ES5 15.4.4.20
	// http://es5.github.com/#x15.4.4.20
	// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
	defineProperties(ArrayPrototype, {
		filter: function filter(callbackfn/*, thisArg*/) {
			let object = ES.ToObject(this);
			let self = splitString && isString(this) ? strSplit(this, '') : object;
			let length = ES.ToUint32(self.length);
			let result = [];
			let value;
			let T;
			if (arguments.length > 1) {
				T = arguments[1];
			}

			// If no callback function or if callback is not a callable function
			if (!isCallable(callbackfn)) {
				throw new TypeError('Array.prototype.filter callback must be a function');
			}

			for (let i = 0; i < length; i++) {
				if (i in self) {
					value = self[i];
					if (typeof T === 'undefined' ? callbackfn(value, i, object) : callbackfn.call(T, value, i, object)) {
						pushCall(result, value);
					}
				}
			}
			return result;
		}
	}, !properlyBoxesContext(ArrayPrototype.filter));

	// ES5 15.4.4.16
	// http://es5.github.com/#x15.4.4.16
	// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
	defineProperties(ArrayPrototype, {
		every: function every(callbackfn/*, thisArg*/) {
			let object = ES.ToObject(this);
			let self = splitString && isString(this) ? strSplit(this, '') : object;
			let length = ES.ToUint32(self.length);
			let T;
			if (arguments.length > 1) {
				T = arguments[1];
			}

			// If no callback function or if callback is not a callable function
			if (!isCallable(callbackfn)) {
				throw new TypeError('Array.prototype.every callback must be a function');
			}

			for (let i = 0; i < length; i++) {
				if (i in self && !(typeof T === 'undefined' ? callbackfn(self[i], i, object) : callbackfn.call(T, self[i], i, object))) {
					return false;
				}
			}
			return true;
		}
	}, !properlyBoxesContext(ArrayPrototype.every));

	// ES5 15.4.4.17
	// http://es5.github.com/#x15.4.4.17
	// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
	defineProperties(ArrayPrototype, {
		some: function some(callbackfn/*, thisArg */) {
			let object = ES.ToObject(this);
			let self = splitString && isString(this) ? strSplit(this, '') : object;
			let length = ES.ToUint32(self.length);
			let T;
			if (arguments.length > 1) {
				T = arguments[1];
			}

			// If no callback function or if callback is not a callable function
			if (!isCallable(callbackfn)) {
				throw new TypeError('Array.prototype.some callback must be a function');
			}

			for (let i = 0; i < length; i++) {
				if (i in self && (typeof T === 'undefined' ? callbackfn(self[i], i, object) : callbackfn.call(T, self[i], i, object))) {
					return true;
				}
			}
			return false;
		}
	}, !properlyBoxesContext(ArrayPrototype.some));

	// ES5 15.4.4.21
	// http://es5.github.com/#x15.4.4.21
	// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
	let reduceCoercesToObject = false;
	if (ArrayPrototype.reduce) {
		reduceCoercesToObject = typeof ArrayPrototype.reduce.call('es5', function (_, __, ___, list) {
			return list;
		}) === 'object';
	}
	defineProperties(ArrayPrototype, {
		reduce: function reduce(callbackfn/*, initialValue*/) {
			let object = ES.ToObject(this);
			let self = splitString && isString(this) ? strSplit(this, '') : object;
			let length = ES.ToUint32(self.length);

			// If no callback function or if callback is not a callable function
			if (!isCallable(callbackfn)) {
				throw new TypeError('Array.prototype.reduce callback must be a function');
			}

			// no value to return if no initial value and an empty array
			if (length === 0 && arguments.length === 1) {
				throw new TypeError('reduce of empty array with no initial value');
			}

			let i = 0;
			let result;
			if (arguments.length >= 2) {
				result = arguments[1];
			} else {
				do {
					if (i in self) {
						result = self[i++];
						break;
					}

					// if array contains no values, no initial value to return
					if (++i >= length) {
						throw new TypeError('reduce of empty array with no initial value');
					}
				} while (true);
			}

			for (; i < length; i++) {
				if (i in self) {
					result = callbackfn(result, self[i], i, object);
				}
			}

			return result;
		}
	}, !reduceCoercesToObject);

	// ES5 15.4.4.22
	// http://es5.github.com/#x15.4.4.22
	// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
	let reduceRightCoercesToObject = false;
	if (ArrayPrototype.reduceRight) {
		reduceRightCoercesToObject = typeof ArrayPrototype.reduceRight.call('es5', function (_, __, ___, list) {
			return list;
		}) === 'object';
	}
	defineProperties(ArrayPrototype, {
		reduceRight: function reduceRight(callbackfn/*, initial*/) {
			let object = ES.ToObject(this);
			let self = splitString && isString(this) ? strSplit(this, '') : object;
			let length = ES.ToUint32(self.length);

			// If no callback function or if callback is not a callable function
			if (!isCallable(callbackfn)) {
				throw new TypeError('Array.prototype.reduceRight callback must be a function');
			}

			// no value to return if no initial value, empty array
			if (length === 0 && arguments.length === 1) {
				throw new TypeError('reduceRight of empty array with no initial value');
			}

			let result;
			let i = length - 1;
			if (arguments.length >= 2) {
				result = arguments[1];
			} else {
				do {
					if (i in self) {
						result = self[i--];
						break;
					}

					// if array contains no values, no initial value to return
					if (--i < 0) {
						throw new TypeError('reduceRight of empty array with no initial value');
					}
				} while (true);
			}

			if (i < 0) {
				return result;
			}

			do {
				if (i in self) {
					result = callbackfn(result, self[i], i, object);
				}
			} while (i--);

			return result;
		}
	}, !reduceRightCoercesToObject);

	// ES5 15.4.4.14
	// http://es5.github.com/#x15.4.4.14
	// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
	let hasFirefox2IndexOfBug = ArrayPrototype.indexOf && [0, 1].indexOf(1, 2) !== -1;
	defineProperties(ArrayPrototype, {
		indexOf: function indexOf(searchElement/*, fromIndex */) {
			let self = splitString && isString(this) ? strSplit(this, '') : ES.ToObject(this);
			let length = ES.ToUint32(self.length);

			if (length === 0) {
				return -1;
			}

			let i = 0;
			if (arguments.length > 1) {
				i = ES.ToInteger(arguments[1]);
			}

			// handle negative indices
			i = i >= 0 ? i : max(0, length + i);
			for (; i < length; i++) {
				if (i in self && self[i] === searchElement) {
					return i;
				}
			}
			return -1;
		}
	}, hasFirefox2IndexOfBug);

	// ES5 15.4.4.15
	// http://es5.github.com/#x15.4.4.15
	// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf
	let hasFirefox2LastIndexOfBug = ArrayPrototype.lastIndexOf && [0, 1].lastIndexOf(0, -3) !== -1;
	defineProperties(ArrayPrototype, {
		lastIndexOf: function lastIndexOf(searchElement/*, fromIndex */) {
			let self = splitString && isString(this) ? strSplit(this, '') : ES.ToObject(this);
			let length = ES.ToUint32(self.length);

			if (length === 0) {
				return -1;
			}
			let i = length - 1;
			if (arguments.length > 1) {
				i = min(i, ES.ToInteger(arguments[1]));
			}
			// handle negative indices
			i = i >= 0 ? i : length - Math.abs(i);
			for (; i >= 0; i--) {
				if (i in self && searchElement === self[i]) {
					return i;
				}
			}
			return -1;
		}
	}, hasFirefox2LastIndexOfBug);

	// ES5 15.4.4.12
	// http://es5.github.com/#x15.4.4.12
	let spliceNoopReturnsEmptyArray = (function () {
		let a = [1, 2];
		let result = a.splice();
		return a.length === 2 && isArray(result) && result.length === 0;
	}());
	defineProperties(ArrayPrototype, {
		// Safari 5.0 bug where .splice() returns undefined
		splice: function splice(start, deleteCount) {
			if (arguments.length === 0) {
				return [];
			} else {
				return array_splice.apply(this, arguments);
			}
		}
	}, !spliceNoopReturnsEmptyArray);

	let spliceWorksWithEmptyObject = (function () {
		let obj = {};
		ArrayPrototype.splice.call(obj, 0, 0, 1);
		return obj.length === 1;
	}());
	defineProperties(ArrayPrototype, {
		splice: function splice(start, deleteCount) {
			if (arguments.length === 0) {
				return [];
			}
			let args = arguments;
			this.length = max(ES.ToInteger(this.length), 0);
			if (arguments.length > 0 && typeof deleteCount !== 'number') {
				args = arraySlice(arguments);
				if (args.length < 2) {
					pushCall(args, this.length - start);
				} else {
					args[1] = ES.ToInteger(deleteCount);
				}
			}
			return array_splice.apply(this, args);
		}
	}, !spliceWorksWithEmptyObject);
	let spliceWorksWithLargeSparseArrays = (function () {
		// Per https://github.com/es-shims/es5-shim/issues/295
		// Safari 7/8 breaks with sparse arrays of size 1e5 or greater
		let arr = new $Array(1e5);
		// note: the index MUST be 8 or larger or the test will false pass
		arr[8] = 'x';
		arr.splice(1, 1);
		// note: this test must be defined *after* the indexOf shim
		// per https://github.com/es-shims/es5-shim/issues/313
		return arr.indexOf('x') === 7;
	}());
	let spliceWorksWithSmallSparseArrays = (function () {
		// Per https://github.com/es-shims/es5-shim/issues/295
		// Opera 12.15 breaks on this, no idea why.
		let n = 256;
		let arr = [];
		arr[n] = 'a';
		arr.splice(n + 1, 0, 'b');
		return arr[n] === 'a';
	}());
	defineProperties(ArrayPrototype, {
		splice: function splice(start, deleteCount) {
			let O = ES.ToObject(this);
			let A = [];
			let len = ES.ToUint32(O.length);
			let relativeStart = ES.ToInteger(start);
			let actualStart = relativeStart < 0 ? max((len + relativeStart), 0) : min(relativeStart, len);
			let actualDeleteCount = min(max(ES.ToInteger(deleteCount), 0), len - actualStart);

			let k = 0;
			let from;
			while (k < actualDeleteCount) {
				from = $String(actualStart + k);
				if (owns(O, from)) {
					A[k] = O[from];
				}
				k += 1;
			}

			let items = arraySlice(arguments, 2);
			let itemCount = items.length;
			let to;
			if (itemCount < actualDeleteCount) {
				k = actualStart;
				let maxK = len - actualDeleteCount;
				while (k < maxK) {
					from = $String(k + actualDeleteCount);
					to = $String(k + itemCount);
					if (owns(O, from)) {
						O[to] = O[from];
					} else {
						delete O[to];
					}
					k += 1;
				}
				k = len;
				let minK = len - actualDeleteCount + itemCount;
				while (k > minK) {
					delete O[k - 1];
					k -= 1;
				}
			} else if (itemCount > actualDeleteCount) {
				k = len - actualDeleteCount;
				while (k > actualStart) {
					from = $String(k + actualDeleteCount - 1);
					to = $String(k + itemCount - 1);
					if (owns(O, from)) {
						O[to] = O[from];
					} else {
						delete O[to];
					}
					k -= 1;
				}
			}
			k = actualStart;
			for (let i = 0; i < items.length; ++i) {
				O[k] = items[i];
				k += 1;
			}
			O.length = len - actualDeleteCount + itemCount;

			return A;
		}
	}, !spliceWorksWithLargeSparseArrays || !spliceWorksWithSmallSparseArrays);

	let originalJoin = ArrayPrototype.join;
	let hasStringJoinBug;
	try {
		hasStringJoinBug = Array.prototype.join.call('123', ',') !== '1,2,3';
	} catch (e) {
		hasStringJoinBug = true;
	}
	if (hasStringJoinBug) {
		defineProperties(ArrayPrototype, {
			join: function join(separator) {
				let sep = typeof separator === 'undefined' ? ',' : separator;
				return originalJoin.call(isString(this) ? strSplit(this, '') : this, sep);
			}
		}, hasStringJoinBug);
	}

	let hasJoinUndefinedBug = [1, 2].join(undefined) !== '1,2';
	if (hasJoinUndefinedBug) {
		defineProperties(ArrayPrototype, {
			join: function join(separator) {
				let sep = typeof separator === 'undefined' ? ',' : separator;
				return originalJoin.call(this, sep);
			}
		}, hasJoinUndefinedBug);
	}

	let pushShim = function push(item) {
		let O = ES.ToObject(this);
		let n = ES.ToUint32(O.length);
		let i = 0;
		while (i < arguments.length) {
			O[n + i] = arguments[i];
			i += 1;
		}
		O.length = n + i;
		return n + i;
	};

	let pushIsNotGeneric = (function () {
		let obj = {};
		let result = Array.prototype.push.call(obj, undefined);
		return result !== 1 || obj.length !== 1 || typeof obj[0] !== 'undefined' || !owns(obj, 0);
	}());
	defineProperties(ArrayPrototype, {
		push: function push(item) {
			if (isArray(this)) {
				return array_push.apply(this, arguments);
			}
			return pushShim.apply(this, arguments);
		}
	}, pushIsNotGeneric);

	// This fixes a very weird bug in Opera 10.6 when pushing `undefined
	let pushUndefinedIsWeird = (function () {
		let arr = [];
		let result = arr.push(undefined);
		return result !== 1 || arr.length !== 1 || typeof arr[0] !== 'undefined' || !owns(arr, 0);
	}());
	defineProperties(ArrayPrototype, { push: pushShim }, pushUndefinedIsWeird);

	// ES5 15.2.3.14
	// http://es5.github.io/#x15.4.4.10
	// Fix boxed string bug
	defineProperties(ArrayPrototype, {
		slice: function (start, end) {
			let arr = isString(this) ? strSplit(this, '') : this;
			return arraySliceApply(arr, arguments);
		}
	}, splitString);

	let sortIgnoresNonFunctions = (function () {
		try {
			[1, 2].sort(null);
			[1, 2].sort({});
			return true;
		} catch (e) {}
		return false;
	}());
	let sortThrowsOnRegex = (function () {
		// this is a problem in Firefox 4, in which `typeof /a/ === 'function'`
		try {
			[1, 2].sort(/a/);
			return false;
		} catch (e) {}
		return true;
	}());
	let sortIgnoresUndefined = (function () {
		// applies in IE 8, for one.
		try {
			[1, 2].sort(undefined);
			return true;
		} catch (e) {}
		return false;
	}());
	defineProperties(ArrayPrototype, {
		sort: function sort(compareFn) {
			if (typeof compareFn === 'undefined') {
				return arraySort(this);
			}
			if (!isCallable(compareFn)) {
				throw new TypeError('Array.prototype.sort callback must be a function');
			}
			return arraySort(this, compareFn);
		}
	}, sortIgnoresNonFunctions || !sortIgnoresUndefined || !sortThrowsOnRegex);

	//
	// Object
	// ======
	//

	// ES5 15.2.3.14
	// http://es5.github.com/#x15.2.3.14

	// http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
	let hasDontEnumBug = !isEnum({ 'toString': null }, 'toString');
	let hasProtoEnumBug = isEnum(function () {}, 'prototype');
	let hasStringEnumBug = !owns('x', '0');
	let equalsConstructorPrototype = function (o) {
		let ctor = o.constructor;
		return ctor && ctor.prototype === o;
	};
	let blacklistedKeys = {
		$window: true,
		$console: true,
		$parent: true,
		$self: true,
		$frame: true,
		$frames: true,
		$frameElement: true,
		$webkitIndexedDB: true,
		$webkitStorageInfo: true,
		$external: true
	};
	let hasAutomationEqualityBug = (function () {
		/* globals window */
		if (typeof window === 'undefined') {
			return false;
		}
		for (let k in window) {
			try {
				if (!blacklistedKeys['$' + k] && owns(window, k) && window[k] !== null && typeof window[k] === 'object') {
					equalsConstructorPrototype(window[k]);
				}
			} catch (e) {
				return true;
			}
		}
		return false;
	}());
	let equalsConstructorPrototypeIfNotBuggy = function (object) {
		if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
			return equalsConstructorPrototype(object);
		}
		try {
			return equalsConstructorPrototype(object);
		} catch (e) {
			return false;
		}
	};
	let dontEnums = [
		'toString',
		'toLocaleString',
		'valueOf',
		'hasOwnProperty',
		'isPrototypeOf',
		'propertyIsEnumerable',
		'constructor'
	];
	let dontEnumsLength = dontEnums.length;

	// taken directly from https://github.com/ljharb/is-arguments/blob/master/index.js
	// can be replaced with require('is-arguments') if we ever use a build process instead
	let isStandardArguments = function isArguments(value) {
		return toStr(value) === '[object Arguments]';
	};
	let isLegacyArguments = function isArguments(value) {
		return value !== null &&
            typeof value === 'object' &&
            typeof value.length === 'number' &&
            value.length >= 0 &&
            !isArray(value) &&
            isCallable(value.callee);
	};
	let isArguments = isStandardArguments(arguments) ? isStandardArguments : isLegacyArguments;

	defineProperties($Object, {
		keys: function keys(object) {
			let isFn = isCallable(object);
			let isArgs = isArguments(object);
			let isObject = object !== null && typeof object === 'object';
			let isStr = isObject && isString(object);

			if (!isObject && !isFn && !isArgs) {
				throw new TypeError('Object.keys called on a non-object');
			}

			let theKeys = [];
			let skipProto = hasProtoEnumBug && isFn;
			if ((isStr && hasStringEnumBug) || isArgs) {
				for (let i = 0; i < object.length; ++i) {
					pushCall(theKeys, $String(i));
				}
			}

			if (!isArgs) {
				for (let name in object) {
					if (!(skipProto && name === 'prototype') && owns(object, name)) {
						pushCall(theKeys, $String(name));
					}
				}
			}

			if (hasDontEnumBug) {
				let skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);
				for (let j = 0; j < dontEnumsLength; j++) {
					let dontEnum = dontEnums[j];
					if (!(skipConstructor && dontEnum === 'constructor') && owns(object, dontEnum)) {
						pushCall(theKeys, dontEnum);
					}
				}
			}
			return theKeys;
		}
	});

	let keysWorksWithArguments = $Object.keys && (function () {
		// Safari 5.0 bug
		return $Object.keys(arguments).length === 2;
	}(1, 2));
	let keysHasArgumentsLengthBug = $Object.keys && (function () {
		let argKeys = $Object.keys(arguments);
		return arguments.length !== 1 || argKeys.length !== 1 || argKeys[0] !== 1;
	}(1));
	let originalKeys = $Object.keys;
	defineProperties($Object, {
		keys: function keys(object) {
			if (isArguments(object)) {
				return originalKeys(arraySlice(object));
			} else {
				return originalKeys(object);
			}
		}
	}, !keysWorksWithArguments || keysHasArgumentsLengthBug);

	//
	// Date
	// ====
	//

	let hasNegativeMonthYearBug = new Date(-3509827329600292).getUTCMonth() !== 0;
	let aNegativeTestDate = new Date(-1509842289600292);
	let aPositiveTestDate = new Date(1449662400000);
	let hasToUTCStringFormatBug = aNegativeTestDate.toUTCString() !== 'Mon, 01 Jan -45875 11:59:59 GMT';
	let hasToDateStringFormatBug;
	let hasToStringFormatBug;
	let timeZoneOffset = aNegativeTestDate.getTimezoneOffset();
	if (timeZoneOffset < -720) {
		hasToDateStringFormatBug = aNegativeTestDate.toDateString() !== 'Tue Jan 02 -45875';
		hasToStringFormatBug = !(/^Thu Dec 10 2015 \d\d:\d\d:\d\d GMT[-\+]\d\d\d\d(?: |$)/).test(aPositiveTestDate.toString());
	} else {
		hasToDateStringFormatBug = aNegativeTestDate.toDateString() !== 'Mon Jan 01 -45875';
		hasToStringFormatBug = !(/^Wed Dec 09 2015 \d\d:\d\d:\d\d GMT[-\+]\d\d\d\d(?: |$)/).test(aPositiveTestDate.toString());
	}

	let originalGetFullYear = call.bind(Date.prototype.getFullYear);
	let originalGetMonth = call.bind(Date.prototype.getMonth);
	let originalGetDate = call.bind(Date.prototype.getDate);
	let originalGetUTCFullYear = call.bind(Date.prototype.getUTCFullYear);
	let originalGetUTCMonth = call.bind(Date.prototype.getUTCMonth);
	let originalGetUTCDate = call.bind(Date.prototype.getUTCDate);
	let originalGetUTCDay = call.bind(Date.prototype.getUTCDay);
	let originalGetUTCHours = call.bind(Date.prototype.getUTCHours);
	let originalGetUTCMinutes = call.bind(Date.prototype.getUTCMinutes);
	let originalGetUTCSeconds = call.bind(Date.prototype.getUTCSeconds);
	let originalGetUTCMilliseconds = call.bind(Date.prototype.getUTCMilliseconds);
	let dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	let monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	let daysInMonth = function daysInMonth(month, year) {
		return originalGetDate(new Date(year, month, 0));
	};

	defineProperties(Date.prototype, {
		getFullYear: function getFullYear() {
			if (!this || !(this instanceof Date)) {
				throw new TypeError('this is not a Date object.');
			}
			let year = originalGetFullYear(this);
			if (year < 0 && originalGetMonth(this) > 11) {
				return year + 1;
			}
			return year;
		},
		getMonth: function getMonth() {
			if (!this || !(this instanceof Date)) {
				throw new TypeError('this is not a Date object.');
			}
			let year = originalGetFullYear(this);
			let month = originalGetMonth(this);
			if (year < 0 && month > 11) {
				return 0;
			}
			return month;
		},
		getDate: function getDate() {
			if (!this || !(this instanceof Date)) {
				throw new TypeError('this is not a Date object.');
			}
			let year = originalGetFullYear(this);
			let month = originalGetMonth(this);
			let date = originalGetDate(this);
			if (year < 0 && month > 11) {
				if (month === 12) {
					return date;
				}
				let days = daysInMonth(0, year + 1);
				return (days - date) + 1;
			}
			return date;
		},
		getUTCFullYear: function getUTCFullYear() {
			if (!this || !(this instanceof Date)) {
				throw new TypeError('this is not a Date object.');
			}
			let year = originalGetUTCFullYear(this);
			if (year < 0 && originalGetUTCMonth(this) > 11) {
				return year + 1;
			}
			return year;
		},
		getUTCMonth: function getUTCMonth() {
			if (!this || !(this instanceof Date)) {
				throw new TypeError('this is not a Date object.');
			}
			let year = originalGetUTCFullYear(this);
			let month = originalGetUTCMonth(this);
			if (year < 0 && month > 11) {
				return 0;
			}
			return month;
		},
		getUTCDate: function getUTCDate() {
			if (!this || !(this instanceof Date)) {
				throw new TypeError('this is not a Date object.');
			}
			let year = originalGetUTCFullYear(this);
			let month = originalGetUTCMonth(this);
			let date = originalGetUTCDate(this);
			if (year < 0 && month > 11) {
				if (month === 12) {
					return date;
				}
				let days = daysInMonth(0, year + 1);
				return (days - date) + 1;
			}
			return date;
		}
	}, hasNegativeMonthYearBug);

	defineProperties(Date.prototype, {
		toUTCString: function toUTCString() {
			if (!this || !(this instanceof Date)) {
				throw new TypeError('this is not a Date object.');
			}
			let day = originalGetUTCDay(this);
			let date = originalGetUTCDate(this);
			let month = originalGetUTCMonth(this);
			let year = originalGetUTCFullYear(this);
			let hour = originalGetUTCHours(this);
			let minute = originalGetUTCMinutes(this);
			let second = originalGetUTCSeconds(this);
			return dayName[day] + ', ' +
                (date < 10 ? '0' + date : date) + ' ' +
                monthName[month] + ' ' +
                year + ' ' +
                (hour < 10 ? '0' + hour : hour) + ':' +
                (minute < 10 ? '0' + minute : minute) + ':' +
                (second < 10 ? '0' + second : second) + ' GMT';
		}
	}, hasNegativeMonthYearBug || hasToUTCStringFormatBug);

	// Opera 12 has `,`
	defineProperties(Date.prototype, {
		toDateString: function toDateString() {
			if (!this || !(this instanceof Date)) {
				throw new TypeError('this is not a Date object.');
			}
			let day = this.getDay();
			let date = this.getDate();
			let month = this.getMonth();
			let year = this.getFullYear();
			return dayName[day] + ' ' +
                monthName[month] + ' ' +
                (date < 10 ? '0' + date : date) + ' ' +
                year;
		}
	}, hasNegativeMonthYearBug || hasToDateStringFormatBug);

	// can't use defineProperties here because of toString enumeration issue in IE <= 8
	if (hasNegativeMonthYearBug || hasToStringFormatBug) {
		Date.prototype.toString = function toString() {
			if (!this || !(this instanceof Date)) {
				throw new TypeError('this is not a Date object.');
			}
			let day = this.getDay();
			let date = this.getDate();
			let month = this.getMonth();
			let year = this.getFullYear();
			let hour = this.getHours();
			let minute = this.getMinutes();
			let second = this.getSeconds();
			let timezoneOffset = this.getTimezoneOffset();
			let hoursOffset = Math.floor(Math.abs(timezoneOffset) / 60);
			let minutesOffset = Math.floor(Math.abs(timezoneOffset) % 60);
			return dayName[day] + ' ' +
                monthName[month] + ' ' +
                (date < 10 ? '0' + date : date) + ' ' +
                year + ' ' +
                (hour < 10 ? '0' + hour : hour) + ':' +
                (minute < 10 ? '0' + minute : minute) + ':' +
                (second < 10 ? '0' + second : second) + ' GMT' +
                (timezoneOffset > 0 ? '-' : '+') +
                (hoursOffset < 10 ? '0' + hoursOffset : hoursOffset) +
                (minutesOffset < 10 ? '0' + minutesOffset : minutesOffset);
		};
		if (supportsDescriptors) {
			$Object.defineProperty(Date.prototype, 'toString', {
				configurable: true,
				enumerable: false,
				writable: true
			});
		}
	}

	// ES5 15.9.5.43
	// http://es5.github.com/#x15.9.5.43
	// This function returns a String value represent the instance in time
	// represented by this Date object. The format of the String is the Date Time
	// string format defined in 15.9.1.15. All fields are present in the String.
	// The time zone is always UTC, denoted by the suffix Z. If the time value of
	// this object is not a finite Number a RangeError exception is thrown.
	let negativeDate = -62198755200000;
	let negativeYearString = '-000001';
	let hasNegativeDateBug = Date.prototype.toISOString && new Date(negativeDate).toISOString().indexOf(negativeYearString) === -1;
	let hasSafari51DateBug = Date.prototype.toISOString && new Date(-1).toISOString() !== '1969-12-31T23:59:59.999Z';

	let getTime = call.bind(Date.prototype.getTime);

	defineProperties(Date.prototype, {
		toISOString: function toISOString() {
			if (!isFinite(this) || !isFinite(getTime(this))) {
				// Adope Photoshop requires the second check.
				throw new RangeError('Date.prototype.toISOString called on non-finite value.');
			}

			let year = originalGetUTCFullYear(this);

			let month = originalGetUTCMonth(this);
			// see https://github.com/es-shims/es5-shim/issues/111
			year += Math.floor(month / 12);
			month = (month % 12 + 12) % 12;

			// the date time string format is specified in 15.9.1.15.
			let result = [month + 1, originalGetUTCDate(this), originalGetUTCHours(this), originalGetUTCMinutes(this), originalGetUTCSeconds(this)];
			year = (
				(year < 0 ? '-' : (year > 9999 ? '+' : '')) +
                strSlice('00000' + Math.abs(year), (0 <= year && year <= 9999) ? -4 : -6)
			);

			for (let i = 0; i < result.length; ++i) {
				// pad months, days, hours, minutes, and seconds to have two digits.
				result[i] = strSlice('00' + result[i], -2);
			}
			// pad milliseconds to have three digits.
			return (
				year + '-' + arraySlice(result, 0, 2).join('-') +
                'T' + arraySlice(result, 2).join(':') + '.' +
                strSlice('000' + originalGetUTCMilliseconds(this), -3) + 'Z'
			);
		}
	}, hasNegativeDateBug || hasSafari51DateBug);

	// ES5 15.9.5.44
	// http://es5.github.com/#x15.9.5.44
	// This function provides a String representation of a Date object for use by
	// JSON.stringify (15.12.3).
	let dateToJSONIsSupported = (function () {
		try {
			return Date.prototype.toJSON &&
                new Date(NaN).toJSON() === null &&
                new Date(negativeDate).toJSON().indexOf(negativeYearString) !== -1 &&
                Date.prototype.toJSON.call({ // generic
                	toISOString: function () { return true; }
                });
		} catch (e) {
			return false;
		}
	}());
	if (!dateToJSONIsSupported) {
		Date.prototype.toJSON = function toJSON(key) {
			// When the toJSON method is called with argument key, the following
			// steps are taken:

			// 1.  Let O be the result of calling ToObject, giving it the this
			// value as its argument.
			// 2. Let tv be ES.ToPrimitive(O, hint Number).
			let O = $Object(this);
			let tv = ES.ToPrimitive(O);
			// 3. If tv is a Number and is not finite, return null.
			if (typeof tv === 'number' && !isFinite(tv)) {
				return null;
			}
			// 4. Let toISO be the result of calling the [[Get]] internal method of
			// O with argument "toISOString".
			let toISO = O.toISOString;
			// 5. If IsCallable(toISO) is false, throw a TypeError exception.
			if (!isCallable(toISO)) {
				throw new TypeError('toISOString property is not callable');
			}
			// 6. Return the result of calling the [[Call]] internal method of
			//  toISO with O as the this value and an empty argument list.
			return toISO.call(O);

			// NOTE 1 The argument is ignored.

			// NOTE 2 The toJSON function is intentionally generic; it does not
			// require that its this value be a Date object. Therefore, it can be
			// transferred to other kinds of objects for use as a method. However,
			// it does require that any such object have a toISOString method. An
			// object is free to use the argument key to filter its
			// stringification.
		};
	}

	// ES5 15.9.4.2
	// http://es5.github.com/#x15.9.4.2
	// based on work shared by Daniel Friesen (dantman)
	// http://gist.github.com/303249
	let supportsExtendedYears = Date.parse('+033658-09-27T01:46:40.000Z') === 1e15;
	let acceptsInvalidDates = !isNaN(Date.parse('2012-04-04T24:00:00.500Z')) || !isNaN(Date.parse('2012-11-31T23:59:59.000Z')) || !isNaN(Date.parse('2012-12-31T23:59:60.000Z'));
	let doesNotParseY2KNewYear = isNaN(Date.parse('2000-01-01T00:00:00.000Z'));
	if (doesNotParseY2KNewYear || acceptsInvalidDates || !supportsExtendedYears) {
		// XXX global assignment won't work in embeddings that use
		// an alternate object for the context.
		/* global Date: true */
		/* eslint-disable no-undef */
		let maxSafeUnsigned32Bit = Math.pow(2, 31) - 1;
		let hasSafariSignedIntBug = isActualNaN(new Date(1970, 0, 1, 0, 0, 0, maxSafeUnsigned32Bit + 1).getTime());
		/* eslint-disable no-implicit-globals */
		Date = (function (NativeDate) {
			/* eslint-enable no-implicit-globals */
			/* eslint-enable no-undef */
			// Date.length === 7
			let DateShim = function Date(Y, M, D, h, m, s, ms) {
				let length = arguments.length;
				let date;
				if (this instanceof NativeDate) {
					let seconds = s;
					let millis = ms;
					if (hasSafariSignedIntBug && length >= 7 && ms > maxSafeUnsigned32Bit) {
						// work around a Safari 8/9 bug where it treats the seconds as signed
						let msToShift = Math.floor(ms / maxSafeUnsigned32Bit) * maxSafeUnsigned32Bit;
						let sToShift = Math.floor(msToShift / 1e3);
						seconds += sToShift;
						millis -= sToShift * 1e3;
					}
					date = length === 1 && $String(Y) === Y ? // isString(Y)
					// We explicitly pass it through parse:
						new NativeDate(DateShim.parse(Y)) :
					// We have to manually make calls depending on argument
					// length here
						length >= 7 ? new NativeDate(Y, M, D, h, m, seconds, millis) :
							length >= 6 ? new NativeDate(Y, M, D, h, m, seconds) :
								length >= 5 ? new NativeDate(Y, M, D, h, m) :
									length >= 4 ? new NativeDate(Y, M, D, h) :
										length >= 3 ? new NativeDate(Y, M, D) :
											length >= 2 ? new NativeDate(Y, M) :
												length >= 1 ? new NativeDate(Y instanceof NativeDate ? +Y : Y) :
													new NativeDate();
				} else {
					date = NativeDate.apply(this, arguments);
				}
				if (!isPrimitive(date)) {
					// Prevent mixups with unfixed Date object
					defineProperties(date, { constructor: DateShim }, true);
				}
				return date;
			};

			// 15.9.1.15 Date Time String Format.
			let isoDateExpression = new RegExp('^' +
                '(\\d{4}|[+-]\\d{6})' + // four-digit year capture or sign +
			// 6-digit extended year
                '(?:-(\\d{2})' + // optional month capture
                '(?:-(\\d{2})' + // optional day capture
                '(?:' + // capture hours:minutes:seconds.milliseconds
                    'T(\\d{2})' + // hours capture
                    ':(\\d{2})' + // minutes capture
                    '(?:' + // optional :seconds.milliseconds
                        ':(\\d{2})' + // seconds capture
                        '(?:(\\.\\d{1,}))?' + // milliseconds capture
                    ')?' +
                '(' + // capture UTC offset component
                    'Z|' + // UTC capture
                    '(?:' + // offset specifier +/-hours:minutes
                        '([-+])' + // sign capture
                        '(\\d{2})' + // hours offset capture
                        ':(\\d{2})' + // minutes offset capture
                    ')' +
                ')?)?)?)?' +
            '$');

			let months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];

			let dayFromMonth = function dayFromMonth(year, month) {
				let t = month > 1 ? 1 : 0;
				return (
					months[month] +
                    Math.floor((year - 1969 + t) / 4) -
                    Math.floor((year - 1901 + t) / 100) +
                    Math.floor((year - 1601 + t) / 400) +
                    365 * (year - 1970)
				);
			};

			let toUTC = function toUTC(t) {
				let s = 0;
				let ms = t;
				if (hasSafariSignedIntBug && ms > maxSafeUnsigned32Bit) {
					// work around a Safari 8/9 bug where it treats the seconds as signed
					let msToShift = Math.floor(ms / maxSafeUnsigned32Bit) * maxSafeUnsigned32Bit;
					let sToShift = Math.floor(msToShift / 1e3);
					s += sToShift;
					ms -= sToShift * 1e3;
				}
				return $Number(new NativeDate(1970, 0, 1, 0, 0, s, ms));
			};

			// Copy any custom methods a 3rd party library may have added
			for (let key in NativeDate) {
				if (owns(NativeDate, key)) {
					DateShim[key] = NativeDate[key];
				}
			}

			// Copy "native" methods explicitly; they may be non-enumerable
			defineProperties(DateShim, {
				now: NativeDate.now,
				UTC: NativeDate.UTC
			}, true);
			DateShim.prototype = NativeDate.prototype;
			defineProperties(DateShim.prototype, {
				constructor: DateShim
			}, true);

			// Upgrade Date.parse to handle simplified ISO 8601 strings
			let parseShim = function parse(string) {
				let match = isoDateExpression.exec(string);
				if (match) {
					// parse months, days, hours, minutes, seconds, and milliseconds
					// provide default values if necessary
					// parse the UTC offset component
					let year = $Number(match[1]),
						month = $Number(match[2] || 1) - 1,
						day = $Number(match[3] || 1) - 1,
						hour = $Number(match[4] || 0),
						minute = $Number(match[5] || 0),
						second = $Number(match[6] || 0),
						millisecond = Math.floor($Number(match[7] || 0) * 1000),
						// When time zone is missed, local offset should be used
						// (ES 5.1 bug)
						// see https://bugs.ecmascript.org/show_bug.cgi?id=112
						isLocalTime = Boolean(match[4] && !match[8]),
						signOffset = match[9] === '-' ? 1 : -1,
						hourOffset = $Number(match[10] || 0),
						minuteOffset = $Number(match[11] || 0),
						result;
					let hasMinutesOrSecondsOrMilliseconds = minute > 0 || second > 0 || millisecond > 0;
					if (
						hour < (hasMinutesOrSecondsOrMilliseconds ? 24 : 25) &&
                        minute < 60 && second < 60 && millisecond < 1000 &&
                        month > -1 && month < 12 && hourOffset < 24 &&
                        minuteOffset < 60 && // detect invalid offsets
                        day > -1 &&
                        day < (dayFromMonth(year, month + 1) - dayFromMonth(year, month))
					) {
						result = (
							(dayFromMonth(year, month) + day) * 24 +
                            hour +
                            hourOffset * signOffset
						) * 60;
						result = (
							(result + minute + minuteOffset * signOffset) * 60 +
                            second
						) * 1000 + millisecond;
						if (isLocalTime) {
							result = toUTC(result);
						}
						if (-8.64e15 <= result && result <= 8.64e15) {
							return result;
						}
					}
					return NaN;
				}
				return NativeDate.parse.apply(this, arguments);
			};
			defineProperties(DateShim, { parse: parseShim });

			return DateShim;
		}(Date));
		/* global Date: false */
	}

	// ES5 15.9.4.4
	// http://es5.github.com/#x15.9.4.4
	if (!Date.now) {
		Date.now = function now() {
			return new Date().getTime();
		};
	}

	//
	// Number
	// ======
	//

	// ES5.1 15.7.4.5
	// http://es5.github.com/#x15.7.4.5
	let hasToFixedBugs = NumberPrototype.toFixed && (
		(0.00008).toFixed(3) !== '0.000' ||
      (0.9).toFixed(0) !== '1' ||
      (1.255).toFixed(2) !== '1.25' ||
      (1000000000000000128).toFixed(0) !== '1000000000000000128'
	);

	let toFixedHelpers = {
		base: 1e7,
		size: 6,
		data: [0, 0, 0, 0, 0, 0],
		multiply: function multiply(n, c) {
			let i = -1;
			let c2 = c;
			while (++i < toFixedHelpers.size) {
				c2 += n * toFixedHelpers.data[i];
				toFixedHelpers.data[i] = c2 % toFixedHelpers.base;
				c2 = Math.floor(c2 / toFixedHelpers.base);
			}
		},
		divide: function divide(n) {
			let i = toFixedHelpers.size;
			let c = 0;
			while (--i >= 0) {
				c += toFixedHelpers.data[i];
				toFixedHelpers.data[i] = Math.floor(c / n);
				c = (c % n) * toFixedHelpers.base;
			}
		},
		numToString: function numToString() {
			let i = toFixedHelpers.size;
			let s = '';
			while (--i >= 0) {
				if (s !== '' || i === 0 || toFixedHelpers.data[i] !== 0) {
					let t = $String(toFixedHelpers.data[i]);
					if (s === '') {
						s = t;
					} else {
						s += strSlice('0000000', 0, 7 - t.length) + t;
					}
				}
			}
			return s;
		},
		pow: function pow(x, n, acc) {
			return (n === 0 ? acc : (n % 2 === 1 ? pow(x, n - 1, acc * x) : pow(x * x, n / 2, acc)));
		},
		log: function log(x) {
			let n = 0;
			let x2 = x;
			while (x2 >= 4096) {
				n += 12;
				x2 /= 4096;
			}
			while (x2 >= 2) {
				n += 1;
				x2 /= 2;
			}
			return n;
		}
	};

	let toFixedShim = function toFixed(fractionDigits) {
		let f, x, s, m, e, z, j, k;

		// Test for NaN and round fractionDigits down
		f = $Number(fractionDigits);
		f = isActualNaN(f) ? 0 : Math.floor(f);

		if (f < 0 || f > 20) {
			throw new RangeError('Number.toFixed called with invalid number of decimals');
		}

		x = $Number(this);

		if (isActualNaN(x)) {
			return 'NaN';
		}

		// If it is too big or small, return the string value of the number
		if (x <= -1e21 || x >= 1e21) {
			return $String(x);
		}

		s = '';

		if (x < 0) {
			s = '-';
			x = -x;
		}

		m = '0';

		if (x > 1e-21) {
			// 1e-21 < x < 1e21
			// -70 < log2(x) < 70
			e = toFixedHelpers.log(x * toFixedHelpers.pow(2, 69, 1)) - 69;
			z = (e < 0 ? x * toFixedHelpers.pow(2, -e, 1) : x / toFixedHelpers.pow(2, e, 1));
			z *= 0x10000000000000; // Math.pow(2, 52);
			e = 52 - e;

			// -18 < e < 122
			// x = z / 2 ^ e
			if (e > 0) {
				toFixedHelpers.multiply(0, z);
				j = f;

				while (j >= 7) {
					toFixedHelpers.multiply(1e7, 0);
					j -= 7;
				}

				toFixedHelpers.multiply(toFixedHelpers.pow(10, j, 1), 0);
				j = e - 1;

				while (j >= 23) {
					toFixedHelpers.divide(1 << 23);
					j -= 23;
				}

				toFixedHelpers.divide(1 << j);
				toFixedHelpers.multiply(1, 1);
				toFixedHelpers.divide(2);
				m = toFixedHelpers.numToString();
			} else {
				toFixedHelpers.multiply(0, z);
				toFixedHelpers.multiply(1 << (-e), 0);
				m = toFixedHelpers.numToString() + strSlice('0.00000000000000000000', 2, 2 + f);
			}
		}

		if (f > 0) {
			k = m.length;

			if (k <= f) {
				m = s + strSlice('0.0000000000000000000', 0, f - k + 2) + m;
			} else {
				m = s + strSlice(m, 0, k - f) + '.' + strSlice(m, k - f);
			}
		} else {
			m = s + m;
		}

		return m;
	};
	defineProperties(NumberPrototype, { toFixed: toFixedShim }, hasToFixedBugs);

	let hasToPrecisionUndefinedBug = (function () {
		try {
			return 1.0.toPrecision(undefined) === '1';
		} catch (e) {
			return true;
		}
	}());
	let originalToPrecision = NumberPrototype.toPrecision;
	defineProperties(NumberPrototype, {
		toPrecision: function toPrecision(precision) {
			return typeof precision === 'undefined' ? originalToPrecision.call(this) : originalToPrecision.call(this, precision);
		}
	}, hasToPrecisionUndefinedBug);

	//
	// String
	// ======
	//

	// ES5 15.5.4.14
	// http://es5.github.com/#x15.5.4.14

	// [bugfix, IE lt 9, firefox 4, Konqueror, Opera, obscure browsers]
	// Many browsers do not split properly with regular expressions or they
	// do not perform the split correctly under obscure conditions.
	// See http://blog.stevenlevithan.com/archives/cross-browser-split
	// I've tested in many browsers and this seems to cover the deviant ones:
	//    'ab'.split(/(?:ab)*/) should be ["", ""], not [""]
	//    '.'.split(/(.?)(.?)/) should be ["", ".", "", ""], not ["", ""]
	//    'tesst'.split(/(s)*/) should be ["t", undefined, "e", "s", "t"], not
	//       [undefined, "t", undefined, "e", ...]
	//    ''.split(/.?/) should be [], not [""]
	//    '.'.split(/()()/) should be ["."], not ["", "", "."]

	if (
		'ab'.split(/(?:ab)*/).length !== 2 ||
        '.'.split(/(.?)(.?)/).length !== 4 ||
        'tesst'.split(/(s)*/)[1] === 't' ||
        'test'.split(/(?:)/, -1).length !== 4 ||
        ''.split(/.?/).length ||
        '.'.split(/()()/).length > 1
	) {
		(function () {
			let compliantExecNpcg = typeof (/()??/).exec('')[1] === 'undefined'; // NPCG: nonparticipating capturing group
			let maxSafe32BitInt = Math.pow(2, 32) - 1;

			StringPrototype.split = function (separator, limit) {
				let string = String(this);
				if (typeof separator === 'undefined' && limit === 0) {
					return [];
				}

				// If `separator` is not a regex, use native split
				if (!isRegex(separator)) {
					return strSplit(this, separator, limit);
				}

				let output = [];
				let flags = (separator.ignoreCase ? 'i' : '') +
                            (separator.multiline ? 'm' : '') +
                            (separator.unicode ? 'u' : '') + // in ES6
                            (separator.sticky ? 'y' : ''), // Firefox 3+ and ES6
					lastLastIndex = 0,
					// Make `global` and avoid `lastIndex` issues by working with a copy
					separator2, match, lastIndex, lastLength;
				let separatorCopy = new RegExp(separator.source, flags + 'g');
				if (!compliantExecNpcg) {
					// Doesn't need flags gy, but they don't hurt
					separator2 = new RegExp('^' + separatorCopy.source + '$(?!\\s)', flags);
				}
				/* Values for `limit`, per the spec:
                 * If undefined: 4294967295 // maxSafe32BitInt
                 * If 0, Infinity, or NaN: 0
                 * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
                 * If negative number: 4294967296 - Math.floor(Math.abs(limit))
                 * If other: Type-convert, then use the above rules
                 */
				let splitLimit = typeof limit === 'undefined' ? maxSafe32BitInt : ES.ToUint32(limit);
				match = separatorCopy.exec(string);
				while (match) {
					// `separatorCopy.lastIndex` is not reliable cross-browser
					lastIndex = match.index + match[0].length;
					if (lastIndex > lastLastIndex) {
						pushCall(output, strSlice(string, lastLastIndex, match.index));
						// Fix browsers whose `exec` methods don't consistently return `undefined` for
						// nonparticipating capturing groups
						if (!compliantExecNpcg && match.length > 1) {
							/* eslint-disable no-loop-func */
							match[0].replace(separator2, function () {
								for (let i = 1; i < arguments.length - 2; i++) {
									if (typeof arguments[i] === 'undefined') {
										match[i] = void 0;
									}
								}
							});
							/* eslint-enable no-loop-func */
						}
						if (match.length > 1 && match.index < string.length) {
							array_push.apply(output, arraySlice(match, 1));
						}
						lastLength = match[0].length;
						lastLastIndex = lastIndex;
						if (output.length >= splitLimit) {
							break;
						}
					}
					if (separatorCopy.lastIndex === match.index) {
						separatorCopy.lastIndex++; // Avoid an infinite loop
					}
					match = separatorCopy.exec(string);
				}
				if (lastLastIndex === string.length) {
					if (lastLength || !separatorCopy.test('')) {
						pushCall(output, '');
					}
				} else {
					pushCall(output, strSlice(string, lastLastIndex));
				}
				return output.length > splitLimit ? arraySlice(output, 0, splitLimit) : output;
			};
		}());

		// [bugfix, chrome]
		// If separator is undefined, then the result array contains just one String,
		// which is the this value (converted to a String). If limit is not undefined,
		// then the output array is truncated so that it contains no more than limit
		// elements.
		// "0".split(undefined, 0) -> []
	} else if ('0'.split(void 0, 0).length) {
		StringPrototype.split = function split(separator, limit) {
			if (typeof separator === 'undefined' && limit === 0) {
				return [];
			}
			return strSplit(this, separator, limit);
		};
	}

	let str_replace = StringPrototype.replace;
	let replaceReportsGroupsCorrectly = (function () {
		let groups = [];
		'x'.replace(/x(.)?/g, function (match, group) {
			pushCall(groups, group);
		});
		return groups.length === 1 && typeof groups[0] === 'undefined';
	}());

	if (!replaceReportsGroupsCorrectly) {
		StringPrototype.replace = function replace(searchValue, replaceValue) {
			let isFn = isCallable(replaceValue);
			let hasCapturingGroups = isRegex(searchValue) && (/\)[*?]/).test(searchValue.source);
			if (!isFn || !hasCapturingGroups) {
				return str_replace.call(this, searchValue, replaceValue);
			} else {
				let wrappedReplaceValue = function (match) {
					let length = arguments.length;
					let originalLastIndex = searchValue.lastIndex;
					searchValue.lastIndex = 0;
					let args = searchValue.exec(match) || [];
					searchValue.lastIndex = originalLastIndex;
					pushCall(args, arguments[length - 2], arguments[length - 1]);
					return replaceValue.apply(this, args);
				};
				return str_replace.call(this, searchValue, wrappedReplaceValue);
			}
		};
	}

	// ECMA-262, 3rd B.2.3
	// Not an ECMAScript standard, although ECMAScript 3rd Edition has a
	// non-normative section suggesting uniform semantics and it should be
	// normalized across all browsers
	// [bugfix, IE lt 9] IE < 9 substr() with negative value not working in IE
	let string_substr = StringPrototype.substr;
	let hasNegativeSubstrBug = ''.substr && '0b'.substr(-1) !== 'b';
	defineProperties(StringPrototype, {
		substr: function substr(start, length) {
			let normalizedStart = start;
			if (start < 0) {
				normalizedStart = max(this.length + start, 0);
			}
			return string_substr.call(this, normalizedStart, length);
		}
	}, hasNegativeSubstrBug);

	// ES5 15.5.4.20
	// whitespace from: http://es5.github.io/#x15.5.4.20
	let ws = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
        '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028' +
        '\u2029\uFEFF';
	let zeroWidth = '\u200b';
	let wsRegexChars = '[' + ws + ']';
	let trimBeginRegexp = new RegExp('^' + wsRegexChars + wsRegexChars + '*');
	let trimEndRegexp = new RegExp(wsRegexChars + wsRegexChars + '*$');
	let hasTrimWhitespaceBug = StringPrototype.trim && (ws.trim() || !zeroWidth.trim());
	defineProperties(StringPrototype, {
		// http://blog.stevenlevithan.com/archives/faster-trim-javascript
		// http://perfectionkills.com/whitespace-deviations/
		trim: function trim() {
			if (typeof this === 'undefined' || this === null) {
				throw new TypeError('can\'t convert ' + this + ' to object');
			}
			return $String(this).replace(trimBeginRegexp, '').replace(trimEndRegexp, '');
		}
	}, hasTrimWhitespaceBug);
	let trim = call.bind(String.prototype.trim);

	let hasLastIndexBug = StringPrototype.lastIndexOf && 'abcあい'.lastIndexOf('あい', 2) !== -1;
	defineProperties(StringPrototype, {
		lastIndexOf: function lastIndexOf(searchString) {
			if (typeof this === 'undefined' || this === null) {
				throw new TypeError('can\'t convert ' + this + ' to object');
			}
			let S = $String(this);
			let searchStr = $String(searchString);
			let numPos = arguments.length > 1 ? $Number(arguments[1]) : NaN;
			let pos = isActualNaN(numPos) ? Infinity : ES.ToInteger(numPos);
			let start = min(max(pos, 0), S.length);
			let searchLen = searchStr.length;
			let k = start + searchLen;
			while (k > 0) {
				k = max(0, k - searchLen);
				let index = strIndexOf(strSlice(S, k, start + searchLen), searchStr);
				if (index !== -1) {
					return k + index;
				}
			}
			return -1;
		}
	}, hasLastIndexBug);

	let originalLastIndexOf = StringPrototype.lastIndexOf;
	defineProperties(StringPrototype, {
		lastIndexOf: function lastIndexOf(searchString) {
			return originalLastIndexOf.apply(this, arguments);
		}
	}, StringPrototype.lastIndexOf.length !== 1);

	// ES-5 15.1.2.2
	/* eslint-disable radix */
	if (parseInt(ws + '08') !== 8 || parseInt(ws + '0x16') !== 22) {
		/* eslint-enable radix */
		/* global parseInt: true */
		parseInt = (function (origParseInt) {
			let hexRegex = /^[\-+]?0[xX]/;
			return function parseInt(str, radix) {
				let string = trim(String(str));
				let defaultedRadix = $Number(radix) || (hexRegex.test(string) ? 16 : 10);
				return origParseInt(string, defaultedRadix);
			};
		}(parseInt));
	}

	// https://es5.github.io/#x15.1.2.3
	if (1 / parseFloat('-0') !== -Infinity) {
		/* global parseFloat: true */
		parseFloat = (function (origParseFloat) {
			return function parseFloat(string) {
				let inputString = trim(String(string));
				let result = origParseFloat(inputString);
				return result === 0 && strSlice(inputString, 0, 1) === '-' ? -0 : result;
			};
		}(parseFloat));
	}

	if (String(new RangeError('test')) !== 'RangeError: test') {
		let errorToStringShim = function toString() {
			if (typeof this === 'undefined' || this === null) {
				throw new TypeError('can\'t convert ' + this + ' to object');
			}
			let name = this.name;
			if (typeof name === 'undefined') {
				name = 'Error';
			} else if (typeof name !== 'string') {
				name = $String(name);
			}
			let msg = this.message;
			if (typeof msg === 'undefined') {
				msg = '';
			} else if (typeof msg !== 'string') {
				msg = $String(msg);
			}
			if (!name) {
				return msg;
			}
			if (!msg) {
				return name;
			}
			return name + ': ' + msg;
		};
		// can't use defineProperties here because of toString enumeration issue in IE <= 8
		Error.prototype.toString = errorToStringShim;
	}

	if (supportsDescriptors) {
		let ensureNonEnumerable = function (obj, prop) {
			if (isEnum(obj, prop)) {
				let desc = Object.getOwnPropertyDescriptor(obj, prop);
				if (desc.configurable) {
					desc.enumerable = false;
					Object.defineProperty(obj, prop, desc);
				}
			}
		};
		ensureNonEnumerable(Error.prototype, 'message');
		if (Error.prototype.message !== '') {
			Error.prototype.message = '';
		}
		ensureNonEnumerable(Error.prototype, 'name');
	}

	if (String(/a/mig) !== '/a/gim') {
		let regexToString = function toString() {
			let str = '/' + this.source + '/';
			if (this.global) {
				str += 'g';
			}
			if (this.ignoreCase) {
				str += 'i';
			}
			if (this.multiline) {
				str += 'm';
			}
			return str;
		};
		// can't use defineProperties here because of toString enumeration issue in IE <= 8
		RegExp.prototype.toString = regexToString;
	}
}));
