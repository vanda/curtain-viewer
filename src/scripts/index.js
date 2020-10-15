import curtainViewerLoader, { CurtainViewer } from './curtain-viewer';

Array.from(document.querySelectorAll('.curtain-viewer'), (curtainViewerEl) => {
  curtainViewerLoader(curtainViewerEl);
});