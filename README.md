# Raphael Viewer

A [viewer](https://vanda.github.io/raphael-viewer/) based on OpenSeaDragon, using the [curtain-sync plugin](https://github.com/cuberis/openseadragon-curtain-sync) for comparing aligned image variants, such as those obtained by multi-spectral imaging, supplied as canvases in a IIIF manifest.


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
