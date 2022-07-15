import curtainViewerLoader, { CurtainViewer } from './curtain-viewer';

/* for purposes of this demo, allow manifest to be set by an optional querystring */
const qstr = new Map(location.search.slice(1).split('&').map(kv => kv.split('=')));
if (qstr.has('manifest')) {
  document.querySelector('.curtain-viewer').dataset.iiifManifest = qstr.get('manifest');
}

/* activate any curtainViewer elements in the page */
Array.from(document.querySelectorAll('.curtain-viewer'), (curtainViewerEl) => {
  curtainViewerLoader(curtainViewerEl);
});