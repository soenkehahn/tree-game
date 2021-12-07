ci: setup
  yarn run tsc
  yarn run jest --forceExit

setup: && svg-to-typescript
  yarn

svg-to-typescript:
  yarn run svgr --typescript src/svgs/*.svg --out-dir src/svgs/

bundle: setup
  rm public -rf
  yarn run parcel \
    build src/index.html \
    --no-source-maps \
    --dist-dir public \
    --public-url https://soenkehahn.github.io/tree-game/

serve: svg-to-typescript
  yarn run parcel src/index.html

watch-tsc:
  yarn run tsc --watch

watch-tests *args:
  yarn run jest --watch --forceExit {{args}}

render-graph:
  dot -Tpdf graph.dot > graph.pdf
