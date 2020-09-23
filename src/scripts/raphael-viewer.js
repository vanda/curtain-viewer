import '../styles/raphael-viewer.scss';
import 'element-closest-polyfill';
import 'fullscreen-polyfill';
import './manifesto';
import './openseadragon-curtain-sync';

const RaphaelViewer = {
  id: 0,
  init: (el) => {
    RaphaelViewer.id += 1;
    const osd = document.createElement('div');
    osd.id = `raphael-viewer${RaphaelViewer.id}`;
    osd.className = 'raphael-viewer__viewer';
    el.osd = el.appendChild(osd);
    const zoomCtrls = el.appendChild(document.createElement('div'));
    zoomCtrls.className = 'raphael-viewer__zoom-ctrls';
    const zoomIn = zoomCtrls.appendChild(document.createElement('div'));
    zoomIn.className = 'raphael-viewer__zoom-in';
    zoomIn.id = zoomIn.className;
    zoomIn.title = 'Zoom in';
    const zoomOut = zoomCtrls.appendChild(document.createElement('div'));
    zoomOut.className = 'raphael-viewer__zoom-out';
    zoomOut.id = zoomOut.className;
    zoomOut.title = 'Zoom out';

    const fullScreen = el.appendChild(document.createElement('div'));
    fullScreen.className = 'raphael-viewer__fullscreen';
    fullScreen.title = 'Full screen';
    fullScreen.innerHTML = `
      <svg role="img" viewBox="0 0 100 100"><path d="M12.346 22.572l17.619 17.612 10.219-10.22-17.612-17.618L31.925 3H3v28.925l9.346-9.353zm10.226 65.082l17.612-17.619-10.22-10.219-17.618 17.612L3 68.075V97h28.925l-9.353-9.346zm54.856-75.308L59.816 29.965l10.22 10.219 17.618-17.612L97 31.925V3H68.075l9.353 9.346zm10.226 65.082L70.035 59.816l-10.219 10.22 17.612 17.618L68.075 97H97V68.075l-9.346 9.353z"/></svg>
    `;
    const drawer = el.appendChild(document.createElement('div'));
    drawer.className = 'raphael-viewer__drawer';
    const handle = drawer.appendChild(document.createElement('div'));
    handle.className = 'raphael-viewer__drawer__handle';
    handle.title = 'More information';

    const dash = drawer.appendChild(document.createElement('div'));
    dash.className = 'raphael-viewer__dash';

    el.labels = dash.appendChild(document.createElement('div'));
    el.labels.className = 'raphael-viewer__labels';

    document.addEventListener('click', (e) => {
      if (e.target.closest('.raphael-viewer__fullscreen')) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          el.requestFullscreen();
        }
      }
      else if (e.target.closest('.raphael-viewer__drawer__handle')) {
        drawer.classList.toggle('raphael-viewer__drawer--open');
      }
    }, false);
  },
  label: (el, label) => {
    el.labels.innerHTML += `
      <div class="raphael-viewer__label">
        <div class="raphael-viewer__key-icon" title="Show/Hide ${label}"></div>
        <div class="raphael-viewer__label-text">${label}</div>
      </div>
    `;
  }
};

const raphaelViewerLoader = function(raphaelViewerEl) {
  const m = raphaelViewerEl.dataset.iiifManifest;
  if (m) {
    Manifesto.loadManifest(m).then((manifest) => {
      RaphaelViewer.init(raphaelViewerEl);
      let mf = null;
      try {
       mf = Manifesto.create(manifest);
      } catch(err) {
        console.log("Invalid manifest");
        return false;
      }
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
          };
        });
      }

      const curtainSyncArgs = {
        container: raphaelViewerEl.osd,
        images: [],
        osdOptions: {
          showHomeControl: false,
          showFullPageControl: false,
          zoomInButton: 'raphael-viewer__zoom-in',
          zoomOutButton: 'raphael-viewer__zoom-out',
          success: (data) => {
            console.log(1); //RaphaelViewer.label(raphaelViewerEl, layer.canvas.getLabel()[0].value);
          }
        }
      };

      Array.from(layers, (layer) => {
        let img = null;

        /* P2 manifest, else P3 */
        if (!mf.context.includes('http://iiif.io/api/presentation/3/context.json')) {
          img = layer.canvas.getImages()[0].getResource().getServices()[0].id;
        } else {
          img = layer.canvas.getContent()[0].getBody()[0].getServices()[0].id;
        }

        curtainSyncArgs.images.push({
          key: 'my-key-1',
          tileSource: `${img}/info.json`,
          shown: true
        });
      });

      raphaelViewerEl.osd = new CurtainSyncViewer(curtainSyncArgs);
      raphaelViewerEl.osd.setMode('curtain');
    });
  }
};

export { raphaelViewerLoader as default, RaphaelViewer };