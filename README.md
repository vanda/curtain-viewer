# LayerStack

A [viewer](https://vanda.github.io/layerstack/) based on OpenSeaDragon for stacking images in superimposition, to examine differences incrementally between similar, or related images, supplied as canvases in a IIIF manifest.
Specific regions of interest are expected to be defined as a _Range_ of _FragmentSelector_ _SpecificResource_ items, e.g [IIIF Presentation API 3.0](https://iiif.io/api/presentation/3.0/#b-example-manifest-response)
(The [Compariscope](https://github.com/vanda/iiif-features#the-compariscope) editor, can assist with preparing region of interest paramaters)


### Installation

```
npm install
```

### Start Dev Server

```
npm start
```

### Build Prod Version

```
npm run build
```

### Features:

* ES6 Support via [babel](https://babeljs.io/) (v7)
* SASS Support via [sass-loader](https://github.com/jtangelder/sass-loader)
* Linting via [eslint-loader](https://github.com/MoOx/eslint-loader)

When you run `npm run build` the [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) is used to move the css to a separate file. The css file gets included in the head of the `index.html`.
