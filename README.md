# normalizeurl

Normalize a url or url fragment by percent-encoding exactly the chars
encodeURIComponent does and removing `/./` and `/foo/../` constructs
like `require('path').resolve` does.

Example:

```javascript
var normalizeUrl = require('normalizeurl');

console.log(normalizeUrl('http://example.com/%7efoo%2Ebar'));
// => 'http://example.com/~foo.bar'

console.log(normalizeUrl('http://example.com/foo/./bar/quux/../blah'));
// => 'http://example.com/foo/bar/blah'
```

It also does the right thing for relative, root-relative, and protocol-relative urls:
```javascript
console.log(normalizeUrl('foo/bar/../blah'));
// => 'foo/bar/blah'

console.log(normalizeUrl('/hey/there/../you?blah?#foo%7e'));
// => '/hey/you?blah?#foo~'

console.log(normalizeUrl('//example.com/%7efoo'));
// => '//example.com/~foo'
```

Url objects already parsed by node.js' built-in `url` module are also supported:

```javascript
console.log(normalizeUrl(require('url').parse('htTP://foo.com/%7ebarf')));
// => {protocol: 'http:', slashes: true, host: 'foo.com', hostname: 'foo.com', pathname: '/~barf', href: 'http://foo.com/~barf', path: '/~barf'}
```

The module works also works in a browser, but only for url fragments
for now. It'll throw an exception if you attempt to normalize an
absolute or protocol-relative url, as that currently relies on
`require('url').parse`.

## License

normalizeurl is licensed under a standard 3-clause BSD license -- see the `LICENSE`-file for details.
