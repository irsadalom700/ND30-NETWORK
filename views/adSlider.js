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

function getSlideWhatsAppUrl(slide) {
  if (!slide || !slide.whatsapp_number) return '';
  let raw = String(slide.whatsapp_number).replace(/[^0-9]/g, '');
  if (!raw) return '';
  if (raw.length === 10) {
    raw = '91' + raw;
  }
  const defaultText = slide.whatsapp_message || 'Hello, I saw your advertisement on ND30 LIVE and would like to connect!';
  return 'https://wa.me/' + raw + '?text=' + encodeURIComponent(defaultText);
}

function renderAdSliderHtml(slides = []) {
  const activeSlides = (slides || []).filter(s => s.is_active === 1);

  return `
  <!-- Advertisement Photo Slider (Design matching Image 2 with WhatsApp Contact Button) -->
  <div class="nd30-ad-slider-card">
    <style>
      .nd30-ad-slider-card {
        background: #0d131f;
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-radius: 12px;
        padding: 14px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
        margin: 0;
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
      .nd30-ad-contact-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
        color: #ffffff !important;
        text-decoration: none;
        font-size: 0.78rem;
        font-weight: 700;
        padding: 5px 12px;
        border-radius: 9999px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 14px rgba(37, 211, 102, 0.45);
        z-index: 15;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        border: 1px solid rgba(255, 255, 255, 0.3);
        cursor: pointer;
        backdrop-filter: blur(4px);
      }
      .nd30-ad-contact-btn:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 20px rgba(37, 211, 102, 0.75);
        color: #ffffff !important;
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
      @media (max-width: 640px) {
        .nd30-ad-slider-card {
          padding: 10px;
          border-radius: 10px;
        }
        .nd30-carousel-container {
          height: 205px;
        }
        .nd30-ad-contact-btn {
          top: 8px;
          right: 8px;
          padding: 5px 10px;
          font-size: 0.72rem;
        }
        .nd30-carousel-caption {
          padding: 14px 10px 8px 10px;
        }
        .nd30-carousel-caption-title {
          font-size: 0.82rem;
        }
        .nd30-carousel-caption-sub {
          font-size: 0.7rem;
        }
        .nd30-carousel-nav-btn {
          width: 28px;
          height: 28px;
          font-size: 1rem;
        }
      }
    </style>

    <div class="nd30-ad-slider-header">
      <span class="nd30-ad-slider-title">ADVERTISEMENT</span>
    </div>

    ${activeSlides.length > 0 ? `
      <div id="nd30AdCarousel" class="nd30-carousel-container" onmouseenter="pauseAdSlider()" onmouseleave="resumeAdSlider()">
        <div id="nd30AdTrack" class="nd30-carousel-track">
          ${activeSlides.map((slide, idx) => {
            const waUrl = getSlideWhatsAppUrl(slide);
            const targetUrl = slide.link_url || waUrl || '#';
            return `
            <div class="nd30-carousel-slide" data-index="${idx}">
              <a href="${escapeHtml(targetUrl)}" ${targetUrl !== '#' ? 'target="_blank" rel="noopener noreferrer"' : ''} style="display:block; width:100%; height:100%; position:relative;">
                <img src="${escapeHtml(slide.image_url)}" alt="${escapeHtml(slide.title || 'Advertisement')}" loading="lazy">
              </a>

              ${waUrl ? `
                <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="nd30-ad-contact-btn" title="Contact on WhatsApp">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>Contact</span>
                </a>
              ` : ''}

              ${(slide.title || slide.caption) ? `
                <div class="nd30-carousel-caption">
                  ${slide.title ? `<h5 class="nd30-carousel-caption-title">${escapeHtml(slide.title)}</h5>` : ''}
                  ${slide.caption ? `<p class="nd30-carousel-caption-sub">${escapeHtml(slide.caption)}</p>` : ''}
                </div>
              ` : ''}
            </div>
            `;
          }).join('')}
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

