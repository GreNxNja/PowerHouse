# Fonts for build scripts

`archivo-latin-variable.ttf` is the Latin subset of Archivo (variable: weight
100–900, width 62–125%), converted from the WOFF2 that next/font self-hosts.
`scripts/og-images.ts` uses it to render the Open Graph cards, because the
image renderer (Pango, via sharp) can't read WOFF2.

The site itself does not use this file; pages get Archivo from next/font.

Archivo © The Archivo Project Authors, licensed under the SIL Open Font
License 1.1 (https://openfontlicense.org). Redistribution is permitted.
