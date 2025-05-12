// Elriel - Scrapyard Marketplace - Lazy Loading

(function() {
  const assetList = document.getElementById('asset-list');
  let assets = [];
  let visibleAssets = [];
  const batchSize = 10;
  let currentIndex = 0;

  // Initialize after page loads
  window.addEventListener('DOMContentLoaded', () => {
    // Get initial data
    const dataElement = document.getElementById('scrapyard-data');
    if (dataElement) {
      try {
        assets = JSON.parse(dataElement.textContent).assets;
        initLazyLoading();
      } catch (err) {
        console.error('Error parsing Scrapyard data:', err);
      }
    }
  });

  function initLazyLoading() {
    loadMoreAssets(); // Load initial batch

    // Set up scroll event listener
    window.addEventListener('scroll', () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        loadMoreAssets();
      }
    });
  }

  function loadMoreAssets() {
    if (currentIndex >= assets.length) {
      window.removeEventListener('scroll', loadMoreAssets);
      return; // No more assets to load
    }

    const nextBatch = assets.slice(currentIndex, currentIndex + batchSize);
    nextBatch.forEach(asset => {
      renderAsset(asset, assetList);
    });

    currentIndex += batchSize;
  }

  function renderAsset(asset, container) {
    if (!asset || !container) return;

    const assetEl = document.createElement('div');
    assetEl.className = 'scrapyard-asset';

    assetEl.innerHTML = `
      <div class="asset-placeholder">Loading...</div>
      <div class="asset-title"><a href="/scrapyard/asset/${asset.id}">${asset.title}</a></div>
      <div class="asset-description">${asset.description}</div>
    `;

    container.appendChild(assetEl);
  }
})();