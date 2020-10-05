import '../styles/raphael-viewer.scss';
import 'element-closest-polyfill';
import 'fullscreen-polyfill';
import './manifesto';
import './openseadragon-curtain-sync'; // modified

const RaphaelViewer = {
  init: (el) => {
    el.innerHTML = `
      <div class="raphael-viewer__viewers">
        <div class="raphael-viewer__viewer">
          <div class="raphael-viewer__osd"></div>
          <div class="raphael-viewer__legend">
            <div class="raphael-viewer__key active" title="Show/Hide" tabindex="0">
              <div class="raphael-viewer__key-label"></div>
              <div class="raphael-viewer__key-toggle"></div>
            </div>
            <div class="raphael-viewer__label"></div>
          </div>
        </div>
      </div>
      <div class="raphael-viewer__zoom-ctrls">
        <div class="raphael-viewer__zoom-in" id="raphael-viewer__zoom-in" title="Zoom in" tabindex="0"></div>
        <div class="raphael-viewer__zoom-out" id="raphael-viewer__zoom-out" title="Zoom out" tabindex="0"></div>
      </div>
      <div class="raphael-viewer__fullscreen" title="Full screen" tabindex="0">
        <svg role="img" viewBox="0 0 100 100">
          <path d="M12.346 22.572l17.619 17.612 10.219-10.22-17.612-17.618L31.925 3H3v28.925l9.346-9.353zm10.226 65.082l17.612-17.619-10.22-10.219-17.618 17.612L3 68.075V97h28.925l-9.353-9.346zm54.856-75.308L59.816 29.965l10.22 10.219 17.618-17.612L97 31.925V3H68.075l9.353 9.346zm10.226 65.082L70.035 59.816l-10.219 10.22 17.612 17.618L68.075 97H97V68.075l-9.346 9.353z"></path>
        </svg>
      </div>
      <div class="raphael-viewer__drawer">
        <div class="raphael-viewer__drawer__handle" title="See more" tabindex="0"></div>
        <div class="raphael-viewer__menu"></div>
      </div>
    `;

    el.viewers = el.querySelector('.raphael-viewer__viewers');
    el.viewer = el.viewers.removeChild(el.viewers.querySelector('.raphael-viewer__viewer'));
    el.activeViewer = null;

    const legend = el.viewer.querySelector('.raphael-viewer__legend');
    el.key = legend.removeChild(legend.querySelector('.raphael-viewer__key'));

    const drawer = el.querySelector('.raphael-viewer__drawer');

    document.addEventListener('click', (e) => {
      if (e.target.closest('.raphael-viewer__zoom-in')) {
        el.activeViewer.osd.zoomIn();
      }
      else if (e.target.closest('.raphael-viewer__zoom-out')) {
        el.activeViewer.osd.zoomOut();
      }
      else if (e.target.closest('.raphael-viewer__fullscreen')) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          el.requestFullscreen();
        }
      }
      else if (e.target.closest('.raphael-viewer__key')) {
        const key = e.target.closest('.raphael-viewer__key');
        key.classList.toggle('active');
        el.activeViewer.osd.setImageShown(key.dataset.layerKey, key.classList.contains('active'));
      }
      else if (e.target.closest('.raphael-viewer__drawer__handle')) {
        drawer.classList.toggle('raphael-viewer__drawer--open');
      }
    }, false);
  },
  newViewer: (el) => {
    const viewer = el.viewers.appendChild(el.viewer.cloneNode(true));
    if (!el.activeViewer) el.activeViewer = viewer;
    return viewer;
  },
  label: (viewer, label) => {
    viewer.querySelector('.raphael-viewer__label').innerText = label;
  },
  key: (el, viewer, label, layerKey) => {
    const key = viewer.querySelector('.raphael-viewer__legend').appendChild(el.key.cloneNode(true));
    key.title = `Show/Hide ${label}`;
    key.dataset.layerKey = layerKey;
    key.querySelector('.raphael-viewer__key-label').innerText = label;
  }
};

const raphaelViewerLoader = function(el) {
  const m = el.dataset.iiifManifest;
  if (m) {
    Manifesto.loadManifest(m).then((manifest) => {
      RaphaelViewer.init(el);

      const loadRaphaelViewer = (mf) => {
        const viewer = RaphaelViewer.newViewer(el);
        
        RaphaelViewer.label(viewer, Manifesto.LanguageMap.getValue(mf.getLabel(), 'en-gb'));

        const curtainSyncArgs = {
          container: viewer.querySelector('.raphael-viewer__osd'),
          images: [],
          osdOptions: {}
        };

        Array.from(mf.getSequences()[0].getCanvases(), (layer) => {
          const key = layer.id;
          const img = layer.getImages()[0].getResource().getServices()[0].id;

          curtainSyncArgs.images.push({
            key: key,
            tileSource: `${img}/info.json`,
            shown: true
          });

          RaphaelViewer.key(el, viewer, Manifesto.LanguageMap.getValue(layer.getLabel(), 'en-gb'), key);
        });

        viewer.osd = new CurtainSyncViewer(curtainSyncArgs);
        viewer.osd.setMode('curtain');
      };

      const mf = Manifesto.create(manifest);

      if (mf.isManifest()) {
        loadRaphaelViewer(mf);
      } 
      else if (mf.isCollection()) {
        Array.from(mf.getManifests(), (mfObj) => {
          Manifesto.loadManifest(mfObj.id).then((mf2) => {
            loadRaphaelViewer(Manifesto.create(mf2));
          }).catch(e => console.error(e.name, e.message));
        });
      }


    }).catch(e => console.error(e.name, e.message));
  }
};

export { raphaelViewerLoader as default, RaphaelViewer };