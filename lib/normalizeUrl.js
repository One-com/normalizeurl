(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('url'));
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.normalizeUrl = factory();
    }
}(this, function (nodeJsUrlModule) {
    function extend(targetObj) { // ...
        for (var i = 1 ; i < arguments.length ; i += 1) {
            var source = arguments[i];
            if (source) {
                for (var prop in source) {
                    targetObj[prop] = source[prop];
                }
            }
        }
        return targetObj;
    }

    // Figure out which ASCII chars are percent-encoded by encodeURIComponent:

    var asciiCharCodesToPercentEncode = [],
        doPercentEncodeByUpperCaseHex = {},
        charByUpperCaseHex = {};

    for (var charCode = 0 ; charCode < 256 ; charCode += 1) {
        var ch = String.fromCharCode(charCode),
            upperCaseHex = charCode.toString(16).toUpperCase();
        while (upperCaseHex.length < 2) {
            upperCaseHex = '0' + upperCaseHex;
        }
        charByUpperCaseHex[upperCaseHex] = ch;
        if (ch !== encodeURIComponent(ch)) {
            doPercentEncodeByUpperCaseHex[upperCaseHex] = true;
            if (charCode < 128 && ch !== '/' && ch !== '%' && ch !== '=') {
                asciiCharCodesToPercentEncode.push(charCode);
            }
        }
    }

    var asciiCharsToPercentEncodeRegExp = new RegExp('[' + asciiCharCodesToPercentEncode.map(function (charCode) {
        var hex = charCode.toString('16');
        return '\\x' + (hex.length < 2 ? '0' : '') + hex;
    }).join('') + ']', 'g');

    // allowPassThroughByChar is optional
    function normalizePercentEncodedChars(urlFragment, allowPassThroughByChar) {
        // Normalize already percent-encoded bytes to upper case (Apache's mod_dav lowercases them):
        return urlFragment.replace(/%([0-9a-f]{2})/gi, function ($0, hex) {
            var upperCaseHex = hex.toUpperCase();
            if (doPercentEncodeByUpperCaseHex[upperCaseHex]) {
                return '%' + upperCaseHex;
            } else {
                return charByUpperCaseHex[upperCaseHex];
            }
        }).replace(asciiCharsToPercentEncodeRegExp, !allowPassThroughByChar ? encodeURIComponent : function ($0) {
            return allowPassThroughByChar[$0] ? $0 : encodeURIComponent($0);
        });
    }

    function normalizeUrlFragment(urlFragment, urlFragmentName) {
        urlFragment = urlFragment || '';
        if (urlFragmentName === 'protocol') {
            urlFragment = urlFragment.toLowerCase();
        } else if (typeof urlFragment === 'string') {
            if (!urlFragmentName || urlFragmentName === 'path' || urlFragmentName === 'pathname') {
                // nodeJsUrlModule.parse('//doma.in/foo/bar') includes the protocol-relative host name in the 'path' and 'pathname' fragments.
                // Detect that and strip it off before normalizing the path so that it doesn't get removed along with a /../ -- and put it back afterwards.
                var matchProtocolRelativeHost = urlFragment.match(/^(\/\/[^\/]+)(\/.*)?$/);
                if (matchProtocolRelativeHost) {
                    urlFragment = matchProtocolRelativeHost[2] || '';
                }

                urlFragment = normalizePercentEncodedChars(urlFragment);

                urlFragment = urlFragment.replace(/\/\.(\/|$)/g, '$1');
                var numReplacements;
                do {
                    numReplacements = 0;
                    urlFragment = urlFragment.replace(/\/[^\/]+\/\.\.(\/|$)/g, function ($0, $1) {
                        numReplacements += 1;
                        return $1;
                    });
                } while (numReplacements > 0);

                if (matchProtocolRelativeHost) {
                    urlFragment = matchProtocolRelativeHost[1] + urlFragment;
                }

                urlFragment = urlFragment || '/';
            } else if (urlFragmentName === 'hash' || urlFragmentName === 'search') {
                // Exclude the leading ? or # from the percent encoding:
                if (urlFragment.length > 0) {
                    urlFragment = urlFragment[0] + normalizePercentEncodedChars(urlFragment.substr(1), {'?': true, '#': urlFragmentName === 'hash'});
                }
            } else if (urlFragmentName === 'host') {
                urlFragment = normalizePercentEncodedChars(urlFragment, {':': true});
            } else if (urlFragmentName === 'auth') {
                urlFragment = normalizePercentEncodedChars(urlFragment, {':': true, '@': true});
            } else {
                urlFragment = normalizePercentEncodedChars(urlFragment);
            }
        }

        return urlFragment;
    }

    return function normalizeUrl(urlOrUrlObj) {
        var inputIsUrlObj = urlOrUrlObj && typeof urlOrUrlObj === 'object',
            urlObj;
        if (inputIsUrlObj) {
            urlObj = extend({}, urlOrUrlObj);
        } else {
            if (nodeJsUrlModule && nodeJsUrlModule.parse) {
                urlObj = nodeJsUrlModule.parse(urlOrUrlObj);
            } else {
                if (/^[\w\+]+:|^\/\//.test(urlOrUrlObj)) {
                    throw new Error('Cannot normalize absolute and protocol-relative urls passed as a string without the node.js url module');
                }
                // Do a poor man's split into 'pathname', 'search', and 'hash' fragments. This regexp should match all strings:
                var matchQueryStringAndFragmentIdentifier = urlOrUrlObj.match(/^([^?#]*)(\?[^#]*)?(#(.*))?$/);

                return normalizeUrlFragment(matchQueryStringAndFragmentIdentifier[1], 'pathname') +
                    normalizeUrlFragment(matchQueryStringAndFragmentIdentifier[2], 'search') +
                    normalizeUrlFragment(matchQueryStringAndFragmentIdentifier[3], 'hash');
            }
        }

        // Remove the aggregated parts of the url object so we don't need to keep them in sync:
        delete urlObj.href;
        delete urlObj.path;

        Object.keys(urlObj).forEach(function (propertyName) {
            urlObj[propertyName] = normalizeUrlFragment(urlObj[propertyName], propertyName);
        });

        if (inputIsUrlObj) {
            // Regenerate the aggregate parts of the url object if we have the node.js URL module:
            if (nodeJsUrlModule) {
                urlObj.href = nodeJsUrlModule.format(urlObj);
                if (urlObj.pathname || urlObj.search) {
                    urlObj.path = (urlObj.pathname || '') + (urlObj.search || '');
                }
            }
            return urlObj;
        } else {
            return nodeJsUrlModule.format(urlObj);
        }
    };
}));
