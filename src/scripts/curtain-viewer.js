import '../styles/curtain-viewer.scss';
import 'fullscreen-polyfill';
import './manifesto';
import './openseadragon-curtain-sync'; // modified

const CurtainViewer = {
  init: (el) => {
    el.innerHTML = `
      <div class="curtain-viewer__viewers">
        <div class="curtain-viewer__viewer">
          <div class="curtain-viewer__osd"></div>
          <div class="curtain-viewer__legend">
            <button class="curtain-viewer__key" title="Show/Hide">
              <div class="curtain-viewer__key-label"></div>
              <div class="curtain-viewer__key-toggle"></div>
            </button>
            <div class="curtain-viewer__label"></div>
          </div>
        </div>
      </div>
      <div class="curtain-viewer__zoom-ctrls">
        <button class="curtain-viewer__zoom-in" id="curtain-viewer__zoom-in" title="Zoom in"></button>
        <button class="curtain-viewer__zoom-out" id="curtain-viewer__zoom-out" title="Zoom out"></button>
      </div>
      <button class="curtain-viewer__fullscreen" title="Full screen">
        <svg role="img" viewBox="0 0 100 100">
          <path d="M12.346 22.572l17.619 17.612 10.219-10.22-17.612-17.618L31.925 3H3v28.925l9.346-9.353zm10.226 65.082l17.612-17.619-10.22-10.219-17.618 17.612L3 68.075V97h28.925l-9.353-9.346zm54.856-75.308L59.816 29.965l10.22 10.219 17.618-17.612L97 31.925V3H68.075l9.353 9.346zm10.226 65.082L70.035 59.816l-10.219 10.22 17.612 17.618L68.075 97H97V68.075l-9.346 9.353z"></path>
        </svg>
      </button>
      <div class="curtain-viewer__drawer">
        <div class="curtain-viewer__menu" role="listbox" aria-label="image selector">
          <button class="curtain-viewer__menu-tab" title="">
            <img src="" alt="">
          </button>
        </div>
      </div>
    `;

    el.viewers = el.querySelector('.curtain-viewer__viewers');
    el.viewer = el.viewers.removeChild(el.viewers.querySelector('.curtain-viewer__viewer'));
    const legend = el.viewer.querySelector('.curtain-viewer__legend');
    el.key = legend.removeChild(legend.querySelector('.curtain-viewer__key'));
    el.menu = el.querySelector('.curtain-viewer__menu');
    el.menuTab = el.menu.removeChild(el.menu.querySelector('.curtain-viewer__menu-tab'));
    el.activeViewer = null;

    document.addEventListener('click', (e) => {
      if (e.target.closest('.curtain-viewer__zoom-in')) {
        el.activeViewer.osd.zoomIn();
      }
      else if (e.target.closest('.curtain-viewer__zoom-out')) {
        el.activeViewer.osd.zoomOut();
      }
      else if (e.target.closest('.curtain-viewer__fullscreen')) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          el.requestFullscreen();
        }
      }
      else if (e.target.closest('.curtain-viewer__key')) {
        const key = e.target.closest('.curtain-viewer__key');
        key.classList.toggle('active');
        el.activeViewer.osd.setImageShown(key.dataset.layerKey, key.classList.contains('active'));
      }
      else if (e.target.closest('.curtain-viewer__menu-tab')) {
        const activatingTab = e.target.closest('.curtain-viewer__menu-tab');
        el.menu.querySelector('[active]').removeAttribute('active');
        activatingTab.setAttribute('active', true);
        const activatingViewer = activatingTab.viewer;
        el.activeViewer.removeAttribute('active');
        activatingViewer.setAttribute('active', true);
        el.activeViewer = activatingViewer;
      }
    }, false);
  },
  newViewer: (el) => {
    const viewer = el.viewers.appendChild(el.viewer.cloneNode(true));
    if (!el.activeViewer) el.activeViewer = viewer;
    return viewer;
  },
  index: (el, viewer, img, label) => {
    const menuTab = el.menu.appendChild(el.menuTab.cloneNode(true));
    const menuImg = menuTab.querySelector('img');
    menuImg.src = img;
    menuImg.alt = label;
    menuTab.title = label;
    menuTab.viewer = viewer;
    if (viewer === el.activeViewer) {
      menuTab.setAttribute('active', true);
      viewer.setAttribute('active', true);
    }
  },
  label: (viewer, label) => {
    viewer.querySelector('.curtain-viewer__label').innerText = label;
  },
  key: (el, viewer, label, layerKey, type) => {
    const key = viewer.querySelector('.curtain-viewer__legend').appendChild(el.key.cloneNode(true));
    key.title = `Show/Hide ${label}`;
    key.dataset.layerKey = layerKey;
    key.querySelector('.curtain-viewer__key-label').innerText = label;
    if (key === viewer.querySelector('.curtain-viewer__key')) key.classList.add('active');
    if (type) key.classList.add(type);
  }
};

const curtainViewerLoader = function(el) {
  const m = el.dataset.iiifManifest;
  if (m) {
    Manifesto.loadManifest(m).then((manifest) => {
      CurtainViewer.init(el);

      const mf = Manifesto.create(manifest);

      const loadCurtainViewer = (mf) => {
        const viewer = CurtainViewer.newViewer(el);
        const label = Manifesto.LanguageMap.getValue(mf.getLabel(), 'en-gb');

        CurtainViewer.label(viewer, label);

        const curtainSyncArgs = {
          container: viewer.querySelector('.curtain-viewer__osd'),
          images: [],
          osdOptions: {
            tabIndex: -1
          }
        };

        let layers = null;
        /* P2 manifest, else P3 */
        if (!mf.context.includes('http://iiif.io/api/presentation/3/context.json')) {
          layers = Array.from(mf.getSequences()[0].getCanvases(), (item) => {
            return { canvas: item };
          });
        } else {
          const stack = mf.getAllRanges().find((range) => {
            return range.__jsonld.behavior.includes('superimpose-regions');
          });
          if (stack) {
            console.log("Note! Curtain viewer does not do alignment, so any alignment should be done in the tilesources themselves.");
            layers = Array.from(stack.__jsonld.items, (item) => {
              return {
                canvas: mf.getSequences()[0].getCanvasById(item.source),
                region: item.selector.value
              };
            });
          }
        }

        let layer1 = true;
        let imgID = null;
        let thumbImgID = null;
        let clipped = false;

        Array.from(layers, (layer) => {
          let region = null;

          if (layer.region) {
            imgID = layer.canvas.getContent()[0].getBody()[0].getServices()[0].id;
            region = layer.region.slice(9).split(',');
          } else {
            imgID = layer.canvas.getImages()[0].getResource().getServices()[0].id;
          }

          let type = null;
          const imgTechnique = layer.canvas.getMetadata().filter(label => label.getLabel().toLowerCase() == 'imaging technique');
          if (imgTechnique[0]) {
            switch (imgTechnique[0].getValue().toLowerCase()) {
              case 'visible light':
                type = 'colour';
                break;
              case 'infrared':
                type = 'blackwhite';
                break;
              case 'x-ray':
              case 'surface scan':
                type = 'grey';
                break;
            }
          }

          const key = layer.canvas.id;
          curtainSyncArgs.images.push({
            key: key,
            tileSource: `${imgID}/info.json`,
            shown: layer1
          });
          CurtainViewer.key(el, viewer, Manifesto.LanguageMap.getValue(layer.canvas.getLabel(), 'en-gb'), key, type);

          if (layer1) {
            layer1 = false;
            thumbImgID = imgID;
          }
        });

        viewer.osd = new CurtainSyncViewer(curtainSyncArgs);
        viewer.osd.setMode('curtain');

        CurtainViewer.index(el, viewer, `${thumbImgID}/full/140,/0/default.jpg`, label);
      };

      if (mf.isManifest()) {
        loadCurtainViewer(mf);
        el.menu.remove();
      } 
      else if (mf.isCollection()) {
        Array.from(mf.getManifests(), (mfObj) => {
          Manifesto.loadManifest(mfObj.id).then((mf2) => {
            loadCurtainViewer(Manifesto.create(mf2));
          }).catch(e => console.error(e.name, e.message));
        });
      }


    }).catch(e => console.error(e.name, e.message));
  }
};

export { curtainViewerLoader as default, CurtainViewer };
