import OpenSeadragon from 'openseadragon';
import './manifesto.bundle.js';
import '../styles/index.scss';

const iiifLayerStack = {
  id: 0,
  init: (el) => {
    iiifLayerStack.id += 1;
    const osd = document.createElement('div');
    osd.id = `layerstack${iiifLayerStack.id}`;
    osd.className = 'layerstack-osd';
    el.stackHeight = 0;
    el.appendChild(osd);
    const zoomCtrls = el.appendChild(document.createElement('div'));
    zoomCtrls.className = 'layerstack-zoom-ctrls';
    const zoomIn = zoomCtrls.appendChild(document.createElement('a'));
    zoomIn.id = 'layerstack-zoom-in';
    zoomIn.title = 'Zoom in';
    zoomIn.href = '#zoom-in';
    const zoomOut = zoomCtrls.appendChild(document.createElement('a'));
    zoomOut.id = 'layerstack-zoom-out';
    zoomOut.title = 'Zoom out';
    zoomOut.href = '#zoom-out';
    const fullScreen = zoomCtrls.appendChild(document.createElement('a'));
    fullScreen.id = 'layerstack-full-screen';
    fullScreen.title = 'Full screen';
    fullScreen.href = '#full-screen';
    el.osd = OpenSeadragon({
      id: `layerstack${iiifLayerStack.id}`,
      showHomeControl: false,
      zoomInButton: 'layerstack-zoom-in',
      zoomOutButton: 'layerstack-zoom-out',
      fullPageButton: 'layerstack-full-screen'
    });

    const dash = el.appendChild(document.createElement('div'));
    dash.className = 'layerstack-dash';

    el.fader = dash.appendChild(document.createElement('input'));
    el.fader.className = 'layerstack-fader';
    el.fader.type = 'range';
    el.fader.min = 1;
    el.fader.step = 0.005;
    el.fader.viewer = el;
    el.fader.oninput = (e) => { 
      window.requestAnimationFrame(() => {
        iiifLayerStack.fade(el, e.target.value);
      });
    };

    el.key = dash.appendChild(document.createElement('div'));
    el.key.className = 'layerstack-key';

    el.labels = dash.appendChild(document.createElement('div'));
    el.labels.className = 'layerstack-labels';

    return el;
  },
  addItem: (el, osdArgs, label) => {
    el.osd.addTiledImage(osdArgs);
    el.stackHeight += 1;
    el.fader.max = el.stackHeight;
    el.fader.value = el.fader.max;
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
  },
  key: (el, label) => {
    el.key.innerHTML = '';
    for (let i = 0; i < el.stackHeight; ++i) {
      el.key.innerHTML += `
        <div class="layerstack-keyline" style="width:${i*100/(el.stackHeight-1)}%">${i+1}</div>
      `;
    }
    el.labels.innerHTML += `
      <div class="layerstack-label" data-layerstack-layer="${el.stackHeight}">
        <div class="layerstack-labelkey">${el.stackHeight}</div>
        <div class="layerstack-labeltext">${label}</div>
      </div>
    `;
    document.addEventListener('click', (e) => {
      if (e.target.closest('.layerstack-label')) {
        iiifLayerStack.fade(el, e.target.closest('.layerstack-label').dataset.layerstackLayer);
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
