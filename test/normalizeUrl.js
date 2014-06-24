var unexpected = require('unexpected'),
    normalizeUrl = require('../lib/normalizeUrl'),
    URL = require('url');

describe('normalizeUrl', function () {
    var expect = unexpected.clone();
    expect.addAssertion('to normalize to [itself]', function (expect, subject, value) {
        expect(normalizeUrl(subject), 'to equal', this.flags.itself ? subject : value);
    });

    describe('applied to an already parsed url object', function () {
        var urlObj = URL.parse('HTTP://example.com/%7efoo?bar'),
            normalizedUrlObj = normalizeUrl(urlObj);

        it('should return a new url object', function () {
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
            expect('HTTP://example.com/', 'to normalize to', 'http://example.com/');
        });

        it('should uppercase percent encoded bytes', function () {
            expect('http://example.com/foo%fbbar/', 'to normalize to', 'http://example.com/foo%FBbar/');
        });

        it('should convert needlessly percent-encoded bytes to the corresponding ASCII char', function () {
            expect('http://example.com/%7efoo%2Ebar', 'to normalize to', 'http://example.com/~foo.bar');
        });

        it('should remove redundant /./ constructs', function () {
            expect('http://example.com/./foo/./bar/.', 'to normalize to', 'http://example.com/foo/bar');
        });

        it('should remove /subdir/../ constructs', function () {
            expect('http://example.com/../some/subdir/../bar/other/../thing/../here/goes/a/bunch/../../nothing/', 'to normalize to', 'http://example.com/../some/bar/here/goes/nothing/');
        });

        it('should leave /./ and /../ alone in the query string', function () {
            expect('http://example.com/?foo/bar/../quux/./blah', 'to normalize to itself');
        });

        it('should leave /./ and /../ alone in the fragment identifier', function () {
            expect('http://example.com/#foo/bar/../quux/./blah', 'to normalize to', 'http://example.com/#foo/bar/../quux/./blah');
        });

        it('should leave additional ? characters alone in the query string', function () {
            expect('http://example.com/?hey?there', 'to normalize to', 'http://example.com/?hey?there');
        });

        it('should leave ? alone in the fragment identifier', function () {
            expect('http://example.com/#foo?hey', 'to normalize to', 'http://example.com/#foo?hey');
        });

        it('should leave additional # characters alone in the fragment identifier', function () {
            expect('http://example.com/#foo#hey', 'to normalize to', 'http://example.com/#foo#hey');
        });

        it('should leave equal signs in GET parameters alone', function () {
            expect('http://example.com/pi=ng', 'to normalize to', 'http://example.com/pi=ng');
        });

        it('should leave equal signs in GET parameters alone', function () {
            expect('http://example.com/ping?the=thing', 'to normalize to', 'http://example.com/ping?the=thing');
        });

        it('should normalize already percent encoded equal signs in GET parameters', function () {
            expect('http://example.com/ping?the%3dthing%3D', 'to normalize to', 'http://example.com/ping?the%3Dthing%3D');
        });

        it('should leave equal signs in the fragment identifier alone', function () {
            expect('http://example.com/ping#the=thing', 'to normalize to itself');
        });

        it('should normalize already percent encoded equal signs in the fragment identifier', function () {
            expect('http://example.com/ping#the%3dthing%3D', 'to normalize to', 'http://example.com/ping#the%3Dthing%3D');
        });

        it('should leave equal signs in the path alone', function () {
            expect('http://example.com/pi=ng', 'to normalize to itself');
        });

        it('should normalize already percent encoded equal signs in the path', function () {
            expect('http://example.com/pi%3dng%3D', 'to normalize to', 'http://example.com/pi%3Dng%3D');
        });

        it('should not percent encode the colon separating the host name and the port number', function () {
            expect('http://example.com:1234/', 'to normalize to itself');
        });

        it('should not percent encode the colon separating the ip and the port number', function () {
            expect('http://0.0.0.0:1234/', 'to normalize to itself');
        });

        it('should leave the username and password alone', function () {
            expect('http://admin:123456@example.com:1234/', 'to normalize to itself');
        });

        it('should leave a username with a percent encoded at-sign alone', function () {
            expect('http://ad%40min:123456@example.com:1234/', 'to normalize to itself');
        });
    });

    describe('applied to a protocol-relative url', function () {
        it('should uppercase percent encoded bytes', function () {
            expect('//example.com/foo%fbbar/', 'to normalize to', '//example.com/foo%FBbar/');
        });

        it('should convert needlessly percent-encoded bytes to the corresponding ASCII char', function () {
            expect('//example.com/%7efoo%2Ebar', 'to normalize to', '//example.com/~foo.bar');
        });

        it('should remove redundant /./ constructs', function () {
            expect('//example.com/./foo/./bar/.', 'to normalize to', '//example.com/foo/bar');
        });

        it('should remove /subdir/../ constructs', function () {
            expect('//example.com/../some/subdir/../bar/other/../thing/../here/goes/a/bunch/../../nothing/', 'to normalize to', '//example.com/../some/bar/here/goes/nothing/');
        });

        it('should not break if there is no slash after the host name', function () {
            expect('//%65', 'to normalize to itself');
        });

        it('should leave percent-encoded chars in the host name alone (garbage in...)', function () {
            expect('//%65/%65', 'to normalize to', '//%65/e');
        });
    });

    describe('applied to a relative url', function () {
        it('should uppercase percent encoded bytes', function () {
            expect('/foo%fbbar/', 'to normalize to', '/foo%FBbar/');
        });

        it('should convert needlessly percent-encoded bytes to the corresponding ASCII char', function () {
            expect('/%7efoo%2Ebar', 'to normalize to', '/~foo.bar');
        });

        it('should remove redundant /./ constructs', function () {
            expect('/./foo/./bar', 'to normalize to', '/foo/bar');
        });

        it('should remove /. at the end', function () {
            expect('/bar/.', 'to normalize to', '/bar');
        });

        it('should remove /.. at the end if preceeded by a directory name', function () {
            expect('/bar/..', 'to normalize to', '/');
        });

        it('should leave /.. at the end if not preceeded by a directory name', function () {
            expect('/..', 'to normalize to itself');
        });

        it('should leave ./ at the start of a relative url', function () {
            expect('./foo', 'to normalize to itself');
        });

        it('should remove /subdir/../ constructs', function () {
            expect('/../some/subdir/../bar/other/../thing/../here/goes/a/bunch/../../nothing/', 'to normalize to', '/../some/bar/here/goes/nothing/');
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
            it('should leave slashes alone', function () {
                expect('/abc/def', 'to normalize to itself');
            });

            it('should leave a percent-encoded percent sign alone', function () {
                expect('/a%25c', 'to normalize to itself');
            });

            it('should un-percent-encode safe ASCII chars', function () {
                expect('/a%28%29c', 'to normalize to', '/a()c');
            });

            it('should leave legitimately percent-encoded octets alone', function () {
                expect('/%E2%98%BA', 'to normalize to itself');
            });

            it('should upper case legitimate, but lower cased percent-encoded chars', function () {
                expect('/%e2%98%ba', 'to normalize to', '/%E2%98%BA');
            });

            it('should leave non-ASCII chars alone', function () {
                expect('/æ', 'to normalize to itself'); // Garbage in, garbage out
            });

            it('should percent-encode exactly the right ASCII chars', function () {
                expect(
                    ' !"$&\'()*+,-./0123456789:;<=>@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~',
                    'to normalize to',
                    '%20!%22%24%26\'()*%2B%2C-./0123456789%3A%3B%3C=%3E%40ABCDEFGHIJKLMNOPQRSTUVWXYZ%5B%5C%5D%5E_%60abcdefghijklmnopqrstuvwxyz%7B%7C%7D~%7F'
                );
            });

            it('should uppercase percent encoded bytes', function () {
                expect('/foo%fbbar/', 'to normalize to', '/foo%FBbar/');
            });

            it('should convert needlessly percent-encoded bytes to the corresponding ASCII char', function () {
                expect('/%7efoo%2Ebar', 'to normalize to', '/~foo.bar');
            });

            it('should remove redundant /./ constructs', function () {
                expect('/./foo/./bar/.', 'to normalize to', '/foo/bar');
            });

            it('should keep the trailing / after a removed /./', function () {
                expect('/./foo/./bar/./', 'to normalize to', '/foo/bar/');
            });

            it('should remove /subdir/../ constructs', function () {
                expect('/../some/subdir/../bar/other/../thing/../here/goes/a/bunch/../../nothing/', 'to normalize to', '/../some/bar/here/goes/nothing/');
            });

            it('should leave a query string alone', function () {
                expect('foo?bar', 'to normalize to itself');
            });

            it('should leave a fragment identifier alone', function () {
                expect('foo#bar', 'to normalize to itself');
            });

            it('should allow # and ? in the fragment identifier', function () {
                expect('foo#bar#quux?hey%7e', 'to normalize to', 'foo#bar#quux?hey~');
            });

            it('should allow ? in the query string', function () {
                expect('foo#bar?hey~?', 'to normalize to', 'foo#bar?hey~?');
            });
        });

        afterEach(function () {
            URL.parse = originalUrlParse;
        });
    });
});
