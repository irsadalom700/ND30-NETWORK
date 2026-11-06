/**
 * ND30 LIVE - Sidebar Advertisement Photo Slider Component
 * Matches design with "ADVERTISEMENT" header, auto-sliding carousel,
 * navigation arrows, indicators, and links.
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderAdSliderHtml(slides = []) {
  const activeSlides = (slides || []).filter(s => s.is_active === 1);

  return `
  <!-- Sidebar Advertisement Photo Slider (Design matching Image 2) -->
  <div class="sidebar-widget nd30-ad-slider-card">
    <style>
      .nd30-ad-slider-card {
        background: #0d131f;
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-radius: 12px;
        padding: 14px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
        margin-bottom: 24px;
        position: relative;
        overflow: hidden;
      }
      .nd30-ad-slider-header {
        text-align: center;
        padding-bottom: 10px;
        margin-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }
      .nd30-ad-slider-title {
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        color: #94a3b8;
        display: inline-block;
      }
      .nd30-carousel-container {
        position: relative;
        width: 100%;
        height: 250px;
        border-radius: 8px;
        overflow: hidden;
        background: #0a0f18;
      }
      .nd30-carousel-track {
        display: flex;
        width: 100%;
        height: 100%;
        transition: transform 0.45s cubic-bezier(0.25, 1, 0.5, 1);
      }
      .nd30-carousel-slide {
        min-width: 100%;
        height: 100%;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .nd30-carousel-slide img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform 0.3s ease;
      }
      .nd30-carousel-slide a:hover img {
        transform: scale(1.02);
      }
      .nd30-carousel-caption {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(180deg, transparent 0%, rgba(10, 15, 24, 0.88) 60%, rgba(10, 15, 24, 0.98) 100%);
        padding: 20px 12px 10px 12px;
        color: #ffffff;
        text-align: left;
        pointer-events: none;
      }
      .nd30-carousel-caption-title {
        font-size: 0.88rem;
        font-weight: 700;
        color: #ffffff;
        margin: 0 0 2px 0;
        line-height: 1.3;
      }
      .nd30-carousel-caption-sub {
        font-size: 0.75rem;
        color: #cbd5e1;
        margin: 0;
        line-height: 1.2;
      }
      .nd30-carousel-nav-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 32px;
        height: 32px;
        background: rgba(15, 23, 42, 0.75);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        cursor: pointer;
        z-index: 10;
        backdrop-filter: blur(4px);
        transition: all 0.2s ease;
      }
      .nd30-carousel-nav-btn:hover {
        background: #dc2626;
        border-color: #dc2626;
        box-shadow: 0 0 10px rgba(220, 38, 38, 0.6);
        transform: translateY(-50%) scale(1.1);
      }
      .nd30-carousel-prev { left: 8px; }
      .nd30-carousel-next { right: 8px; }

      .nd30-carousel-dots {
        position: absolute;
        bottom: 8px;
        right: 10px;
        display: flex;
        gap: 5px;
        z-index: 10;
      }
      .nd30-carousel-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.35);
        cursor: pointer;
        transition: all 0.25s ease;
      }
      .nd30-carousel-dot.active {
        background: #dc2626;
        width: 18px;
        border-radius: 4px;
        box-shadow: 0 0 8px rgba(220, 38, 38, 0.8);
      }
      .nd30-ad-slider-empty {
        height: 220px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: rgba(255, 255, 255, 0.02);
        border: 1px dashed rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        padding: 20px;
      }
    </style>

    <div class="nd30-ad-slider-header">
      <span class="nd30-ad-slider-title">ADVERTISEMENT</span>
    </div>

    ${activeSlides.length > 0 ? `
      <div id="nd30AdCarousel" class="nd30-carousel-container" onmouseenter="pauseAdSlider()" onmouseleave="resumeAdSlider()">
        <div id="nd30AdTrack" class="nd30-carousel-track">
          ${activeSlides.map((slide, idx) => `
            <div class="nd30-carousel-slide" data-index="${idx}">
              ${slide.link_url ? `
                <a href="${escapeHtml(slide.link_url)}" target="_blank" rel="noopener noreferrer" style="display:block; width:100%; height:100%;">
                  <img src="${escapeHtml(slide.image_url)}" alt="${escapeHtml(slide.title || 'Advertisement')}" loading="lazy">
                </a>
              ` : `
                <img src="${escapeHtml(slide.image_url)}" alt="${escapeHtml(slide.title || 'Advertisement')}" loading="lazy">
              `}

              ${(slide.title || slide.caption) ? `
                <div class="nd30-carousel-caption">
                  ${slide.title ? `<h5 class="nd30-carousel-caption-title">${escapeHtml(slide.title)}</h5>` : ''}
                  ${slide.caption ? `<p class="nd30-carousel-caption-sub">${escapeHtml(slide.caption)}</p>` : ''}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        ${activeSlides.length > 1 ? `
          <!-- Navigation Arrows -->
          <button type="button" class="nd30-carousel-nav-btn nd30-carousel-prev" onclick="prevAdSlide()" aria-label="Previous Slide">&lsaquo;</button>
          <button type="button" class="nd30-carousel-nav-btn nd30-carousel-next" onclick="nextAdSlide()" aria-label="Next Slide">&rsaquo;</button>

          <!-- Dots Indicator -->
          <div class="nd30-carousel-dots">
            ${activeSlides.map((_, i) => `
              <span class="nd30-carousel-dot ${i === 0 ? 'active' : ''}" onclick="goToAdSlide(${i})"></span>
            `).join('')}
          </div>
        ` : ''}
      </div>

      ${activeSlides.length > 1 ? `
      <script>
        (function() {
          var currentSlide = 0;
          var totalSlides = ${activeSlides.length};
          var track = document.getElementById('nd30AdTrack');
          var dots = document.querySelectorAll('.nd30-carousel-dot');
          var timer = null;

          function updateSlider() {
            if (!track) return;
            track.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
            dots.forEach(function(dot, i) {
              if (i === currentSlide) {
                dot.classList.add('active');
              } else {
                dot.classList.remove('active');
              }
            });
          }

          window.nextAdSlide = function() {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateSlider();
          };

          window.prevAdSlide = function() {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateSlider();
          };

          window.goToAdSlide = function(idx) {
            currentSlide = idx;
            updateSlider();
          };

          function startAutoSlide() {
            if (timer) clearInterval(timer);
            timer = setInterval(function() {
              window.nextAdSlide();
            }, 3600);
          }

          window.pauseAdSlider = function() {
            if (timer) clearInterval(timer);
          };

          window.resumeAdSlider = function() {
            startAutoSlide();
          };

          startAutoSlide();
        })();
      </script>
      ` : ''}
    ` : `
      <!-- Empty State / Book Ad CTA -->
      <div class="nd30-ad-slider-empty">
        <span style="font-size:1.8rem; margin-bottom:8px;">📢</span>
        <h5 style="color:#ffffff; font-size:0.95rem; font-weight:700; margin:0 0 6px 0;">Advertise With ND30 LIVE</h5>
        <p style="color:#94a3b8; font-size:0.78rem; line-height:1.4; margin:0 0 12px 0;">Reach 500,000+ verified daily readers across Assam & Northeast India.</p>
        <button type="button" onclick="openAdModal && openAdModal()" class="btn btn-primary" style="font-size:0.8rem; padding:6px 14px; border-radius:6px;">
          🚀 Book Ad Slot
        </button>
      </div>
    `}
  </div>
  `;
}

module.exports = {
  renderAdSliderHtml
};
