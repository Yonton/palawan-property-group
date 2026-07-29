/* ============================================================
   Decap CMS — live preview for Property Listings
   ------------------------------------------------------------
   Replaces Decap's default "label: value" preview pane with a
   rendering of how the listing will actually appear on the site:
   the card as it shows in the /listings grid, then the property
   page itself.

   Kept deliberately dependency-free — it runs off the globals the
   Decap bundle exposes. If those ever go missing the script bows
   out quietly and the CMS falls back to the default preview,
   rather than leaving the editor with a blank pane.
   ============================================================ */
(function () {
  var createEl =
    window.h ||
    (window.React && window.React.createElement) ||
    (window.CMS && window.CMS.h);

  if (!window.CMS || !createEl) {
    console.warn('[preview] Decap globals not found — using default preview.');
    return;
  }

  /* ---------- helpers ---------- */

  function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function isBlank(v) {
    return v === null || v === undefined || v === '';
  }

  // Mirrors formatPrice() in src/data/site.ts — keep the two in step.
  function formatPrice(price, priceLabel, currency) {
    if (isBlank(price)) return priceLabel || 'Inquire for price';
    var amount = Number(price);
    if (!isFinite(amount)) return priceLabel || 'Inquire for price';
    var code = /^[A-Za-z]{3}$/.test(currency || '')
      ? String(currency).toUpperCase()
      : 'PHP';
    try {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (e) {
      return '₱' + amount.toLocaleString('en-PH');
    }
  }

  // Images already committed live under /images/... and resolve as-is.
  // Freshly uploaded ones only exist as a local blob, which getAsset resolves.
  function assetUrl(getAsset, path) {
    if (!path) return '';
    try {
      var asset = getAsset(path);
      if (asset) {
        var url = asset.toString();
        if (url && url !== '[object Object]' && url !== 'undefined') return url;
      }
    } catch (e) {
      /* fall through to the raw path */
    }
    return path;
  }

  function toList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(function (v) { return !isBlank(v); });
    return [value];
  }

  var ICON_PIN =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  var ICON_PIN_LG = ICON_PIN.replace(/width="14" height="14"/, 'width="18" height="18"');
  var ICON_ARROW =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var ICON_CHECK =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6L9 17l-5-5"/></svg>';
  var ICON_PLAY =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M21.6 7.2s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16 4 12 4 12 4s-4 0-6.8.3c-.4 0-1.2 0-2 .9-.6.6-.8 2-.8 2S2.2 8.8 2.2 10.5v1.6c0 1.6.2 3.3.2 3.3s.2 1.4.8 2c.8.8 1.8.8 2.2.9 1.6.1 6.6.2 6.6.2s4 0 6.8-.3c.4 0 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.3v-1.6c0-1.6-.2-3.3-.2-3.3zM10 14.4V8.7l5.2 2.9-5.2 2.8z"/></svg>';

  function heroMarkup(url, alt, className) {
    if (url) {
      return '<img src="' + esc(url) + '" alt="' + esc(alt) + '"' + (className ? ' class="' + className + '"' : '') + ' />';
    }
    return '<div class="pv-noimg">No photo chosen yet</div>';
  }

  /* ---------- the card, as it appears in the /listings grid ---------- */

  function cardHtml(d, heroUrl) {
    var specs = [];
    if (d.lotSizeLabel) specs.push({ label: 'Lot', value: d.lotSizeLabel });
    if (d.beachfrontMeters) specs.push({ label: 'Beachfront', value: d.beachfrontMeters + ' m' });
    if (d.bedrooms) specs.push({ label: 'Beds', value: String(d.bedrooms) });
    if (d.bathrooms) specs.push({ label: 'Baths', value: String(d.bathrooms) });

    var specsHtml = specs.length
      ? '<ul class="pv-card-specs">' +
        specs
          .map(function (s) {
            return (
              '<li><span class="pv-spec-value">' + esc(s.value) + '</span>' +
              '<span class="pv-spec-label">' + esc(s.label) + '</span></li>'
            );
          })
          .join('') +
        '</ul>'
      : '';

    var title = d.title
      ? esc(d.title)
      : '<span class="pv-empty">Untitled property</span>';
    var shortDesc = d.shortDescription
      ? esc(d.shortDescription)
      : '<span class="pv-empty">No short description yet — this is the line buyers read first.</span>';

    return (
      '<div class="pv-card">' +
        '<div class="pv-card-media">' +
          heroMarkup(heroUrl, d.title) +
          (d.propertyType ? '<span class="pv-card-type">' + esc(d.propertyType) + '</span>' : '') +
          (d.status && d.status !== 'available' ? '<span class="pv-card-status">' + esc(d.status) + '</span>' : '') +
        '</div>' +
        '<div class="pv-card-body">' +
          '<p class="pv-card-location">' + ICON_PIN + esc(d.location || '') + '</p>' +
          '<h3 class="pv-card-title">' + title + '</h3>' +
          '<p class="pv-card-desc">' + shortDesc + '</p>' +
          specsHtml +
          '<div class="pv-card-foot">' +
            '<span class="pv-card-price">' + esc(formatPrice(d.price, d.priceLabel, d.currency)) + '</span>' +
            '<span class="pv-card-cta">View details' + ICON_ARROW + '</span>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ---------- the property page ---------- */

  function pageHtml(d, heroUrl, galleryUrls) {
    var facts = [];
    if (d.lotSizeLabel) facts.push({ label: 'Lot size', value: d.lotSizeLabel });
    if (d.beachfrontMeters) facts.push({ label: 'Beachfront', value: d.beachfrontMeters + ' meters' });
    if (d.bedrooms) facts.push({ label: 'Bedrooms', value: String(d.bedrooms) });
    if (d.bathrooms) facts.push({ label: 'Bathrooms', value: String(d.bathrooms) });
    if (d.floorAreaSqm) facts.push({ label: 'Floor area', value: d.floorAreaSqm + ' sqm' });
    if (d.propertyType) facts.push({ label: 'Type', value: d.propertyType });

    var factsHtml = facts
      .map(function (f) {
        return (
          '<div class="pv-fact"><span class="pv-fact-value">' + esc(f.value) + '</span>' +
          '<span class="pv-fact-label">' + esc(f.label) + '</span></div>'
        );
      })
      .join('');

    var paragraphs = toList(d.description)
      .map(function (p) { return '<p class="pv-para">' + esc(p) + '</p>'; })
      .join('');

    function block(title, inner) {
      return '<div class="pv-block"><h3 class="pv-sub-title">' + esc(title) + '</h3>' + inner + '</div>';
    }

    var highlights = toList(d.highlights);
    var highlightsHtml = highlights.length
      ? block(
          'Investment highlights',
          '<ul class="pv-check-list">' +
            highlights.map(function (item) { return '<li>' + ICON_CHECK + '<span>' + esc(item) + '</span></li>'; }).join('') +
          '</ul>'
        )
      : '';

    var galleryHtml = galleryUrls.length
      ? block(
          'Photos',
          '<div class="pv-gallery">' +
            galleryUrls.map(function (u) { return '<img src="' + esc(u) + '" alt="" />'; }).join('') +
          '</div>'
        )
      : '';

    var utilities = toList(d.utilities);
    var utilitiesHtml = utilities.length
      ? block(
          'Utilities & infrastructure',
          '<ul class="pv-dot-list">' + utilities.map(function (u) { return '<li>' + esc(u) + '</li>'; }).join('') + '</ul>'
        )
      : '';

    var access = toList(d.accessNotes);
    var accessHtml = access.length
      ? block(
          'Location & access',
          '<ul class="pv-dot-list">' + access.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>'
        )
      : '';

    var videos = toList(d.youtube);
    var videosHtml = videos.length
      ? block(
          'Aerial & video tour',
          videos
            .map(function (v) {
              return '<div class="pv-video">' + ICON_PLAY + '<span>' + esc(v) + '</span></div>';
            })
            .join('')
        )
      : '';

    var pageTitle = d.title ? esc(d.title) : '<span style="opacity:.7">Untitled property</span>';

    return (
      '<div class="pv-page">' +
        '<div class="pv-hero">' +
          heroMarkup(heroUrl, d.title) +
          '<div class="pv-hero-scrim"></div>' +
          '<div class="pv-hero-inner">' +
            (d.propertyType ? '<span class="pv-hero-type">' + esc(d.propertyType) + '</span>' : '') +
            '<h1 class="pv-hero-title">' + pageTitle + '</h1>' +
            '<p class="pv-hero-loc">' + ICON_PIN_LG + esc(d.location || '') + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="pv-facts">' +
          '<div class="pv-facts-list">' + factsHtml + '</div>' +
          '<div class="pv-facts-price">' +
            '<span class="pv-price-amount">' + esc(formatPrice(d.price, d.priceLabel, d.currency)) + '</span>' +
            '<span class="pv-btn-sun">Inquire now</span>' +
          '</div>' +
        '</div>' +
        '<div class="pv-body">' +
          '<p class="pv-eyebrow">About this property</p>' +
          '<h2 class="pv-block-title">' + esc(d.shortDescription || '') + '</h2>' +
          paragraphs +
          highlightsHtml +
          galleryHtml +
          utilitiesHtml +
          accessHtml +
          videosHtml +
        '</div>' +
      '</div>'
    );
  }

  /* ---------- "before you publish" nudges ---------- */

  function warningsHtml(d) {
    var problems = [];
    if (!d.title) problems.push('Add a <strong>title</strong> — it becomes the headline.');
    if (!d.slug) problems.push('Add a <strong>URL slug</strong> before uploading photos, or they land in an unnamed folder.');
    if (!d.heroImage) problems.push('Choose a <strong>hero image</strong> — the card looks empty without one.');
    if (!d.shortDescription) problems.push('Write a <strong>short description</strong> — it shows on the card and in Google.');
    if (!d.location) problems.push('Add a <strong>location</strong>.');
    if (d.currency && !/^[A-Za-z]{3}$/.test(d.currency)) {
      problems.push(
        'The <strong>currency</strong> should be a 3-letter code like <strong>PHP</strong> — the price goes in the price box.'
      );
    }
    if (!problems.length) return '';
    return (
      '<div class="pv-warn"><strong>Still to fill in</strong><ul>' +
      problems.map(function (p) { return '<li>' + p + '</li>'; }).join('') +
      '</ul></div>'
    );
  }

  /* ---------- preview component ---------- */

  function ListingPreview(props) {
    var data = props.entry.get('data');
    var d = data && data.toJS ? data.toJS() : {};
    var getAsset = props.getAsset;

    var heroUrl = assetUrl(getAsset, d.heroImage);
    var galleryUrls = toList(d.gallery).map(function (g) { return assetUrl(getAsset, g); });

    var html =
      warningsHtml(d) +
      '<p class="pv-section-label">On the properties page</p>' +
      '<div class="pv-card-stage">' + cardHtml(d, heroUrl) + '</div>' +
      '<p class="pv-section-label">The property page</p>' +
      pageHtml(d, heroUrl, galleryUrls);

    return createEl('div', {
      className: 'pv',
      dangerouslySetInnerHTML: { __html: html },
    });
  }

  window.CMS.registerPreviewStyle(
    'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'
  );
  window.CMS.registerPreviewStyle('/admin/preview.css');
  window.CMS.registerPreviewTemplate('listings', ListingPreview);
})();
