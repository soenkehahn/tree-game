ci: setup svg-to-typescript
  yarn run tsc
  yarn run jest --forceExit

setup:
  yarn

svg-to-typescript:
  yarn run svgr --typescript src/frontend/svgs/*.svg --out-dir src/frontend/svgs/

bundle: svg-to-typescript
  yarn run parcel build src/frontend/index.html

serve: svg-to-typescript
  yarn run parcel src/frontend/index.html

watch-tsc:
  yarn run tsc --watch

watch-tests *args:
  yarn run jest --watch --forceExit {{args}}

render-graph:
  dot -Tpdf graph.dot > graph.pdf
