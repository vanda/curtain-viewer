import '../styles/index.scss';
import OpenSeadragon from 'openseadragon';
import 'element-closest-polyfill';
import 'fullscreen-polyfill';
import './manifesto.bundle.js';

const iiifLayerStack = {
  id: 0,
  init: (el) => {
    iiifLayerStack.id += 1;
    const osd = document.createElement('div');
    osd.id = `layerstack${iiifLayerStack.id}`;
    osd.className = 'layerstack__osd';
    el.stackHeight = 0;
    el.appendChild(osd);
    const zoomCtrls = el.appendChild(document.createElement('div'));
    zoomCtrls.className = 'layerstack__zoom-ctrls';
    const zoomIn = zoomCtrls.appendChild(document.createElement('div'));
    zoomIn.className = 'layerstack__zoom-in';
    zoomIn.id = zoomIn.className;
    zoomIn.title = 'Zoom in';
    const zoomOut = zoomCtrls.appendChild(document.createElement('div'));
    zoomOut.className = 'layerstack__zoom-out';
    zoomOut.id = zoomOut.className;
    zoomOut.title = 'Zoom out';
    el.osd = OpenSeadragon({
      id: `layerstack${iiifLayerStack.id}`,
      showHomeControl: false,
      showFullPageControl: false,
      zoomInButton: 'layerstack__zoom-in',
      zoomOutButton: 'layerstack__zoom-out'
    });

    const fullScreen = el.appendChild(document.createElement('div'));
    fullScreen.className = 'layerstack__fullscreen';
    fullScreen.title = 'Full screen';
    fullScreen.innerHTML = `
      <svg role="img" viewBox="0 0 100 100"><path d="M12.346 22.572l17.619 17.612 10.219-10.22-17.612-17.618L31.925 3H3v28.925l9.346-9.353zm10.226 65.082l17.612-17.619-10.22-10.219-17.618 17.612L3 68.075V97h28.925l-9.353-9.346zm54.856-75.308L59.816 29.965l10.22 10.219 17.618-17.612L97 31.925V3H68.075l9.353 9.346zm10.226 65.082L70.035 59.816l-10.219 10.22 17.612 17.618L68.075 97H97V68.075l-9.346 9.353z"/></svg>
    `;
    document.addEventListener('click', (e) => {
      if (e.target.closest('.layerstack__fullscreen')) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          el.requestFullscreen();
        }
      }
    }, false);

    const drawer = el.appendChild(document.createElement('div'));
    drawer.className = 'layerstack__drawer';
    const handle = drawer.appendChild(document.createElement('div'));
    handle.className = 'layerstack__drawer__handle';
    handle.title = 'More information';
    document.addEventListener('click', (e) => {
      if (e.target.closest('.layerstack__drawer__handle')) {
        drawer.classList.toggle('layerstack__drawer--open');
      }
    }, false);

    const dash = drawer.appendChild(document.createElement('div'));
    dash.className = 'layerstack__dash';

    el.fader = dash.appendChild(document.createElement('input'));
    el.fader.className = 'layerstack__fader';
    el.fader.type = 'range';
    el.fader.min = 1;
    el.fader.step = 0.005;
    const colors = window.getComputedStyle(el.fader);
    const color1 = colors.getPropertyValue('background-color');
    const color2 = colors.getPropertyValue('color');
    el.fader.color = () => {
      const percent = 100 * (el.fader.value - el.fader.min) / (el.fader.max - el.fader.min);
      el.fader.style.background = `linear-gradient(to right, ${color2} 0%, ${color2} ${percent}%, ${color1} ${percent}%, ${color1} 100%)`;
    };
    el.fader.oninput = el.fader.onchange = (e) => {
      window.requestAnimationFrame(() => {
        iiifLayerStack.fade(el, e.target.value);
      });
    };

    el.key = dash.appendChild(document.createElement('div'));
    el.key.className = 'layerstack__key';
    el.labels = dash.appendChild(document.createElement('div'));
    el.labels.className = 'layerstack__labels';

    return el;
  },
  addItem: (el, osdArgs, label) => {
    el.osd.addTiledImage(osdArgs);
    el.stackHeight += 1;
    el.fader.max = el.stackHeight;
    el.fader.value = el.fader.max;
    el.fader.color();
    iiifLayerStack.key(el, label);
  },
  fade: (el, x) => {
    el.fader.value = x;
    const bgLayer = Math.floor(x);
    const opacity = (el.nofade) ? 0 : x - bgLayer;
    for (let i = el.stackHeight; i > 0; i--) {
      if (i > bgLayer + 1 ) {
        el.osd.world.getItemAt(i-1).setOpacity(0);
      } else if (i === bgLayer + 1) {
        el.osd.world.getItemAt(i-1).setOpacity(opacity);
      } else {
        el.osd.world.getItemAt(i-1).setOpacity(1);
      }
    }
    el.fader.color();
  },
  key: (el, label) => {
    const keyIcon = '<svg role="img" viewBox="0 0 24 14"><path d="M22.214 7.162L11.622 1.286 1.031 7.162l10.591 5.876 10.592-5.876z"/></svg>';
    el.key.innerHTML = '';
    for (let i = 0; i < el.stackHeight; ++i) {
      el.key.innerHTML += `
        <div class="layerstack__key-line" style="width:${i*100/(el.stackHeight-1)}%">
          <div class="layerstack__key-icon">${keyIcon.repeat(i+1)}</div>
        </div>
      `;
    }
    el.labels.innerHTML += `
      <div class="layerstack__label" data-layerstack-layer="${el.stackHeight}">
        <div class="layerstack__key-icon">
          ${keyIcon.repeat(el.stackHeight)}
        </div>
        <div class="layerstack__label-text">${label}</div>
      </div>
    `;
    document.addEventListener('click', (e) => {
      if (e.target.closest('.layerstack__label')) {
        iiifLayerStack.fade(el, e.target.closest('.layerstack__label').dataset.layerstackLayer);
      }
    }, false);
  }
};


const qstr = new Map(location.search.slice(1).split('&').map(kv => kv.split('=')));
let m = '/public/manifest_constable.json';

if (!qstr.has('manifest')) {
  document.location.search = 'manifest=' + m;
} else {
  m = qstr.get('manifest');
}
manifesto.loadManifest(m).then((manifest) => {
  const viewer = iiifLayerStack.init(document.querySelector('.js-layerstack'));
  let mf = null;
  try {
   mf = manifesto.create(manifest);
  } catch(error) {
    alert("Invalid manifest");
    return false;
  }
  let i = 0;
  let vwScaler = null;
  let layers = null;

  /* P2 manifest, else P3 */
  if (!mf.context.includes('http://iiif.io/api/presentation/3/context.json')) {
    console.log("Note! Any specific alignment of layers should be supplied as regions in Fragment Selectors in a P3 manifest.");
    layers = Array.from(mf.getSequences()[0].getCanvases(), (item) => {
      return { canvas: item };
    });
  } else {
    const stack = mf.getAllRanges().find((range) => {
      return range.__jsonld.behavior.includes('superimpose-regions');
    });
    if (!stack) {
      alert("Please provide alignment regions as Fragment Selectors in a P3 manifest.");
      return false;
    }
    layers = Array.from(stack.__jsonld.items, (item) => {
      return {
        canvas: mf.getSequences()[0].getCanvasById(item.source),
        region: item.selector.value
      };
    });
  }

  Array.from(layers, (layer) => {
    const osdArgs = {};
    let img = null;
    let region = null;
    let viewWidth = null;

    /* P2 manifest, else P3 */
    if (!mf.context.includes('http://iiif.io/api/presentation/3/context.json')) {
      img = layer.canvas.getImages()[0].getResource().getServices()[0].id;
    } else {
      img = layer.canvas.getContent()[0].getBody()[0].getServices()[0].id;
      region = layer.region.slice(9).split(',');
    }

    osdArgs.tileSource = `${img}/info.json`;
    if (region) {
      i += 1;
      if (i === 1) {
        viewWidth = 1;
        vwScaler = region[2];
      } else {
        viewWidth = vwScaler / region[2];
      }
      osdArgs.success = function (data) {
        data.item.setWidth(viewWidth);
        data.item.setPosition(
          new OpenSeadragon.Point(
            -(region[0] / 100) * data.item.getBounds().width, 
            -(region[1]  / 100) * data.item.getBounds().height
          )
        );
        if (data.item.viewer.world.getItemCount() === 1) {
          //~ data.item.viewport.zoomTo(100 / region[2]);
          data.item.viewport.panTo(
            new OpenSeadragon.Point(
              (region[0] / 100) + (region[2] / 200),
              ((region[1] / 100) + (region[3] / 200)) 
              * data.item.getBounds().height / data.item.getBounds().width)
          );
        }
      };
    }
    iiifLayerStack.addItem(viewer, osdArgs, layer.canvas.getLabel()[0].value);
  });

  if (qstr.has('nofade')) {
    viewer.nofade = true;
  }
});
