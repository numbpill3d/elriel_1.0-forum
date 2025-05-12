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
    // Set up Intersection Observer
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const assetEl = entry.target;
          const asset = assets.find(a => a.id == assetEl.dataset.assetId);
          if (asset) {
            renderAsset(asset, assetEl);
          }
          observer.unobserve(assetEl); // Stop observing after loading
        }
      });
    }, {
      rootMargin: '200px' // Load assets 200px before they're visible
    });

    // Create initial asset elements and observe them
    assets.forEach(asset => {
      const assetEl = createAssetElement(asset);
      assetEl.dataset.assetId = asset.id; // Store asset ID for later lookup
      assetList.appendChild(assetEl);
      observer.observe(assetEl);
    });
  function renderAsset(asset, container) {
    container.innerHTML = `
      <div class="asset-title"><a href="/scrapyard/asset/${asset.id}">${asset.title}</a></div>
      <div class="asset-description">${asset.description}</div>
    `;
  }

  function createAssetElement(asset) {
    const assetEl = document.createElement('div');
    assetEl.className = 'scrapyard-asset';

    assetEl.innerHTML = `<div class="asset-placeholder">Loading...</div>`;
    return assetEl;
  }
})();