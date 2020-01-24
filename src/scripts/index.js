import layerStacker from './layerstack';

Array.from(document.querySelectorAll('.layerstack'), (layerstackEl) => {
  layerStacker(layerstackEl);
});