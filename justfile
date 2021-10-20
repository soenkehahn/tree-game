ci:
  yarn
  yarn run tsc
  yarn run jest --forceExit

bundle:
  yarn run parcel build src/frontend/index.html
  cp story.yaml dist/

serve:
  mkdir -p dist
  cp story.yaml dist/
  yarn run parcel src/frontend/index.html

watch-tsc:
  yarn run tsc --watch

watch-tests *args:
  yarn run jest --watch --forceExit {{args}}

render-graph:
  dot -Tpdf graph.dot > graph.pdf
