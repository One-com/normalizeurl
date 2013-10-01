var expect = require('unexpected'),
    normalizeUrl = require('../lib/normalizeUrl'),
    URL = require('url');

describe('normalizeUrl', function () {
    describe('applied to an already parsed url object', function () {
        var urlObj = URL.parse('HTTP://example.com/%7efoo?bar'),
            normalizedUrlObj = normalizeUrl(urlObj);

        it('should return new a url object', function () {
            expect(normalizedUrlObj, 'to be an object');
            expect(normalizedUrlObj, 'not to be', urlObj);
        });

        it('should fill in urlObj.href correctly', function () {
            expect(normalizedUrlObj.href, 'to equal', 'http://example.com/~foo?bar');
        });

        it('should fill in urlObj.path correctly', function () {
            expect(normalizedUrlObj.path, 'to equal', '/~foo?bar');
        });
    });

    describe('applied to an absolute url', function () {
        it('should lowercase the protocol', function () {
            expect(normalizeUrl('HTTP://example.com/'), 'to equal', 'http://example.com/');
        });

        it('should uppercase percent encoded bytes', function () {
            expect(normalizeUrl('http://example.com/foo%fbbar/'), 'to equal', 'http://example.com/foo%FBbar/');
        });

        it('should convert needlessly percent-encoded bytes to the corresponding ASCII char', function () {
            expect(normalizeUrl('http://example.com/%7efoo%2Ebar'), 'to equal', 'http://example.com/~foo.bar');
        });

        it('should remove redundant /./ constructs', function () {
            expect(normalizeUrl('http://example.com/./foo/./bar/.'), 'to equal', 'http://example.com/foo/bar');
        });

        it('should remove /subdir/../ constructs', function () {
            expect(normalizeUrl('http://example.com/../some/subdir/../bar/other/../thing/../here/goes/a/bunch/../../nothing/'), 'to equal', 'http://example.com/../some/bar/here/goes/nothing/');
        });

        it('should leave /./ and /../ alone in the query string', function () {
            expect(normalizeUrl('http://example.com/?foo/bar/../quux/./blah'), 'to equal', 'http://example.com/?foo/bar/../quux/./blah');
        });

        it('should leave /./ and /../ alone in the fragment identifier', function () {
            expect(normalizeUrl('http://example.com/#foo/bar/../quux/./blah'), 'to equal', 'http://example.com/#foo/bar/../quux/./blah');
        });

        it('should leave additional ? characters alone in the query string', function () {
            expect(normalizeUrl('http://example.com/?hey?there'), 'to equal', 'http://example.com/?hey?there');
        });

        it('should leave ? alone in the fragment identifier', function () {
            expect(normalizeUrl('http://example.com/#foo?hey'), 'to equal', 'http://example.com/#foo?hey');
        });

        it('should leave additional # characters alone in the fragment identifier', function () {
            expect(normalizeUrl('http://example.com/#foo#hey'), 'to equal', 'http://example.com/#foo#hey');
        });
    });

    describe('applied to a protocol-relative url', function () {
        it('should uppercase percent encoded bytes', function () {
            expect(normalizeUrl('//example.com/foo%fbbar/'), 'to equal', '//example.com/foo%FBbar/');
        });

        it('should convert needlessly percent-encoded bytes to the corresponding ASCII char', function () {
            expect(normalizeUrl('//example.com/%7efoo%2Ebar'), 'to equal', '//example.com/~foo.bar');
        });

        it('should remove redundant /./ constructs', function () {
            expect(normalizeUrl('//example.com/./foo/./bar/.'), 'to equal', '//example.com/foo/bar');
        });

        it('should remove /subdir/../ constructs', function () {
            expect(normalizeUrl('//example.com/../some/subdir/../bar/other/../thing/../here/goes/a/bunch/../../nothing/'), 'to equal', '//example.com/../some/bar/here/goes/nothing/');
        });

        it('should not break if there is no slash after the host name', function () {
            expect(normalizeUrl('//%65'), 'to equal', '//%65');
        });

        it('should leave percent-encoded chars in the host name alone (garbage in...)', function () {
            expect(normalizeUrl('//%65/%65'), 'to equal', '//%65/e');
        });
    });

    describe('applied to a relative url', function () {
        it('should uppercase percent encoded bytes', function () {
            expect(normalizeUrl('/foo%fbbar/'), 'to equal', '/foo%FBbar/');
        });

        it('should convert needlessly percent-encoded bytes to the corresponding ASCII char', function () {
            expect(normalizeUrl('/%7efoo%2Ebar'), 'to equal', '/~foo.bar');
        });

        it('should remove redundant /./ constructs', function () {
            expect(normalizeUrl('/./foo/./bar'), 'to equal', '/foo/bar');
        });

        it('should remove /. at the end', function () {
            expect(normalizeUrl('/bar/.'), 'to equal', '/bar');
        });

        it('should remove /.. at the end if preceeded by a directory name', function () {
            expect(normalizeUrl('/bar/..'), 'to equal', '/');
        });

        it('should leave /.. at the end if not preceeded by a directory name', function () {
            expect(normalizeUrl('/..'), 'to equal', '/..');
        });

        it('should leave ./ at the start of a relative url', function () {
            expect(normalizeUrl('./foo'), 'to equal', './foo');
        });

        it('should remove /subdir/../ constructs', function () {
            expect(normalizeUrl('/../some/subdir/../bar/other/../thing/../here/goes/a/bunch/../../nothing/'), 'to equal', '/../some/bar/here/goes/nothing/');
        });
    });

    describe('running with a crippled url module without a parse function', function () {
        var originalUrlParse = URL.parse;
        beforeEach(function () {
            URL.parse = false;
        });

        it('should throw an exception when attempting to normalize absolute and protocol-relative urls', function () {
            ['http://example.com/', 'svn+ssh://example.com/', '//foo.com/bar'].forEach(function (url) {
                expect(function () {
                    normalizeUrl(url);
                }, 'to throw exception', 'Cannot normalize absolute and protocol-relative urls passed as a string without the node.js url module');
            });
        });

        describe('applied to a relative url', function () {
            it('should uppercase percent encoded bytes', function () {
                expect(normalizeUrl('/foo%fbbar/'), 'to equal', '/foo%FBbar/');
            });

            it('should convert needlessly percent-encoded bytes to the corresponding ASCII char', function () {
                expect(normalizeUrl('/%7efoo%2Ebar'), 'to equal', '/~foo.bar');
            });

            it('should remove redundant /./ constructs', function () {
                expect(normalizeUrl('/./foo/./bar/.'), 'to equal', '/foo/bar');
            });

            it('should keep the trailing / after a removed /./', function () {
                expect(normalizeUrl('/./foo/./bar/./'), 'to equal', '/foo/bar/');
            });

            it('should remove /subdir/../ constructs', function () {
                expect(normalizeUrl('/../some/subdir/../bar/other/../thing/../here/goes/a/bunch/../../nothing/'), 'to equal', '/../some/bar/here/goes/nothing/');
            });
        });

        afterEach(function () {
            URL.parse = originalUrlParse;
        });
    });
});
