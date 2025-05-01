/**
 * Elriel - SEO Enhancement Script
 * This script improves SEO across the application
 */

document.addEventListener('DOMContentLoaded', function() {
  // Add meta descriptions if missing
  addMetaDescriptions();
  
  // Add canonical URLs
  addCanonicalURLs();
  
  // Add structured data
  addStructuredData();
  
  // Add Open Graph tags
  addOpenGraphTags();
  
  // Add Twitter Card tags
  addTwitterCardTags();
  
  console.log('SEO enhancements initialized');
});

/**
 * Add meta descriptions if missing
 */
function addMetaDescriptions() {
  // Check if meta description exists
  let metaDescription = document.querySelector('meta[name="description"]');
  
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    
    // Generate description based on page content
    const pageTitle = document.title || 'ELRIEL';
    const pagePath = window.location.pathname;
    
    let description = 'ELRIEL - A terminal-based haunted network experience.';
    
    // Customize description based on page
    if (pagePath.includes('/feed')) {
      description = 'ELRIEL Bleedstream - Share and discover posts in the terminal network.';
    } else if (pagePath.includes('/glyph')) {
      description = 'ELRIEL Glyph Crucible - Create and explore digital sigils in the terminal network.';
    } else if (pagePath.includes('/whisper')) {
      description = 'ELRIEL Whisperboard - Anonymous messages in the terminal network.';
    } else if (pagePath.includes('/profile')) {
      description = 'ELRIEL User Profile - View user information in the terminal network.';
    } else if (pagePath.includes('/auth')) {
      description = 'ELRIEL Authentication - Access the terminal network.';
    }
    
    metaDescription.setAttribute('content', description);
    document.head.appendChild(metaDescription);
  }
  
  // Add keywords meta tag
  if (!document.querySelector('meta[name="keywords"]')) {
    const metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    metaKeywords.setAttribute('content', 'ELRIEL, terminal, network, digital, haunted, cyberpunk, retro, glitch');
    document.head.appendChild(metaKeywords);
  }
}

/**
 * Add canonical URLs
 */
function addCanonicalURLs() {
  // Check if canonical link exists
  if (!document.querySelector('link[rel="canonical"]')) {
    const canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    
    // Create canonical URL (remove query parameters)
    const url = window.location.origin + window.location.pathname;
    canonicalLink.setAttribute('href', url);
    
    document.head.appendChild(canonicalLink);
  }
}

/**
 * Add structured data
 */
function addStructuredData() {
  // Add basic WebSite structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ELRIEL",
    "description": "A terminal-based haunted network experience",
    "url": window.location.origin
  };
  
  // Add page-specific structured data
  const pagePath = window.location.pathname;
  
  if (pagePath.includes('/feed')) {
    structuredData["@type"] = "WebPage";
    structuredData.name = "ELRIEL Bleedstream";
  } else if (pagePath.includes('/glyph')) {
    structuredData["@type"] = "WebPage";
    structuredData.name = "ELRIEL Glyph Crucible";
  } else if (pagePath.includes('/profile')) {
    // If we're on a profile page, add Person structured data
    const profileName = document.querySelector('.profile-username')?.textContent || 'User';
    
    structuredData["@type"] = "ProfilePage";
    structuredData.name = `${profileName}'s Profile on ELRIEL`;
    structuredData.mainEntity = {
      "@type": "Person",
      "name": profileName
    };
  }
  
  // Add the structured data to the page
  const scriptTag = document.createElement('script');
  scriptTag.type = 'application/ld+json';
  scriptTag.textContent = JSON.stringify(structuredData);
  document.head.appendChild(scriptTag);
}

/**
 * Add Open Graph tags
 */
function addOpenGraphTags() {
  // Basic Open Graph tags
  const ogTags = [
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: document.title || 'ELRIEL' },
    { property: 'og:description', content: document.querySelector('meta[name="description"]')?.getAttribute('content') || 'A terminal-based haunted network experience' },
    { property: 'og:url', content: window.location.href },
    { property: 'og:site_name', content: 'ELRIEL' }
  ];
  
  // Add image if available
  const pageImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '/images/elriel-og-image.png';
  ogTags.push({ property: 'og:image', content: pageImage.startsWith('http') ? pageImage : window.location.origin + pageImage });
  
  // Add the tags to the page
  ogTags.forEach(tag => {
    if (!document.querySelector(`meta[property="${tag.property}"]`)) {
      const metaTag = document.createElement('meta');
      metaTag.setAttribute('property', tag.property);
      metaTag.setAttribute('content', tag.content);
      document.head.appendChild(metaTag);
    }
  });
}

/**
 * Add Twitter Card tags
 */
function addTwitterCardTags() {
  // Basic Twitter Card tags
  const twitterTags = [
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: document.title || 'ELRIEL' },
    { name: 'twitter:description', content: document.querySelector('meta[name="description"]')?.getAttribute('content') || 'A terminal-based haunted network experience' }
  ];
  
  // Add image if available
  const pageImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '/images/elriel-twitter-image.png';
  twitterTags.push({ name: 'twitter:image', content: pageImage.startsWith('http') ? pageImage : window.location.origin + pageImage });
  
  // Add the tags to the page
  twitterTags.forEach(tag => {
    if (!document.querySelector(`meta[name="${tag.name}"]`)) {
      const metaTag = document.createElement('meta');
      metaTag.setAttribute('name', tag.name);
      metaTag.setAttribute('content', tag.content);
      document.head.appendChild(metaTag);
    }
  });
}

// Expose SEO functions globally
window.elrielSEO = {
  addMetaDescriptions,
  addCanonicalURLs,
  addStructuredData,
  addOpenGraphTags,
  addTwitterCardTags
};
