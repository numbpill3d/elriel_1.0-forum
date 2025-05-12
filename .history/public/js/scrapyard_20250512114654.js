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

    // Set up Intersection Observer
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadMoreAssets();
          observer.unobserve(entry.target); // Stop observing after loading
        }
      });
    }, {
      rootMargin: '200px' // Load assets 200px before they're visible
    });

    // Observe each asset
    assets.forEach(asset => {
      const assetEl = createAssetElement(asset);
      assetList.appendChild(assetEl);
      observer.observe(assetEl);
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
  }

  function createAssetElement(asset) {
    const assetEl = document.createElement('div');
    assetEl.className = 'scrapyard-asset';

    assetEl.innerHTML = `
      <div class="asset-placeholder">Loading...</div>
      <div class="asset-title"><a href="/scrapyard/asset/${asset.id}">${asset.title}</a></div>
      <div class="asset-description">${asset.description}</div>
    `;
    return assetEl;
  }
})();