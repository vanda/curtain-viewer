import raphaelViewerLoader, { RaphaelViewer } from './raphael-viewer';

Array.from(document.querySelectorAll('.raphael-viewer'), (raphaelViewerEl) => {
  raphaelViewerLoader(raphaelViewerEl);
});