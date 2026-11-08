# Contributing

Use synthetic examples only. Do not submit private client code, personal data, secrets, copied proprietary assets or unsupported claims.

## Local checks

Use Node 22+; the supplied dependency tuple targets Node 22.23.4 / npm 10.9.9.

```sh
npm install --ignore-scripts
npm test
npm run demo -- --assert
npm run build
```

Installation creates npm's real lock resolution. Do not hand-author integrity hashes. Keep exact direct versions and strict TypeScript with `skipLibCheck: false` and Bundler resolution. Changes to the dependency tuple need separate qualification, including upstream declaration compatibility. No publish or remote deployment workflow belongs here.

## Changes

Preserve the bounded schema, coordinate conventions, and kinematic derivation rules unless proposing an explicit versioned contract change. Add tests with independent expected results, not only calculations repeated from the implementation. Cover rejection atomicity and both locales. Core kinematics must remain mathematically rigorous and independent of React. Document observable behavior in both README languages and update the unreleased changelog.

UI changes need keyboard-labelled DOM operations and functional fallback. Camera controls must only connect while the user explicitly enables them. Clean up listeners, animation loops, and renderer resources.

Keep test evidence precise: core literals, ReactDOM behavior and scene objects are different from real rendered browser evidence. Real WebGL, touch/wheel/page scroll, responsive sizing, focus order, screen-reader interaction and font rendering need browser QA. Do not present a JSDOM probe as a screenshot or visual/accessibility review.

Use GitHub issues or pull requests for non-sensitive discussion. For security issues follow SECURITY.md. General organization contact is the [official homepage](https://lofranotecnologia.com.br). Original contributions use the repository MIT license; bundled dependencies retain their own licenses.
