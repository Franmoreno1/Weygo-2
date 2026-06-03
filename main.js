(function () {
  'use strict';

  // Global error catcher — shows exact line/col in the UI
  window.onerror = function (msg, src, line, col) {
    var body = document.getElementById('quiz-body');
    if (body) {
      body.innerHTML = '<div class="question-wrap"><div class="error-box">' +
        '<strong>Error en línea ' + line + ':' + col + '</strong>' +
        String(msg) + '<br><small>' + String(src).split('/').pop() + '</small>' +
        '</div></div>';
    }
    return false;
  };

  // ============================================================
  //  STATE
  // ============================================================
  let lang = 'en';
  let currentIdx = 0;
  let answers = {};
  let currentItinerary = null;   // stores last result for download

  // true when running on Vercel/production — uses server-side proxy, no user key needed
  function isDeployed() {
    var h = window.location.hostname;
    return h !== 'localhost' && h !== '127.0.0.1' && window.location.protocol !== 'file:';
  }
  let visibleQuestions = [];
  let slideshowTimer = null;
  let currentSlide = 0;
  let isSubmitting = false;   // prevents double-fire

  // ============================================================
  //  SLIDESHOW DATA
  // ============================================================
  const SLIDES = [
    {
      bg: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1920&q=80',
      place: 'Kyoto', country: 'Japan',
      en: 'Where ancient silences bloom', es: 'Donde los silencios ancestrales florecen'
    },
    {
      bg: 'https://images.unsplash.com/photo-1533104182551-7dcbc4d0d63e?auto=format&fit=crop&w=1920&q=80',
      place: 'Santorini', country: 'Greece',
      en: 'Cerulean dreams above the Aegean', es: 'Sueños cerúleos sobre el Egeo'
    },
    {
      bg: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80',
      place: 'Patagonia', country: 'Argentina',
      en: 'At the edge of the known world', es: 'En el confín del mundo conocido'
    },
    {
      bg: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1920&q=80',
      place: 'Tuscany', country: 'Italy',
      en: 'Golden hours among ancient vines', es: 'Horas doradas entre viñas ancestrales'
    },
    {
      bg: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=80',
      place: 'Norwegian Fjords', country: 'Norway',
      en: 'Where the earth folds into the sea', es: 'Donde la tierra se dobla hacia el mar'
    },
    {
      bg: 'https://images.unsplash.com/photo-1539020140153-e476d581e0fa?auto=format&fit=crop&w=1920&q=80',
      place: 'Marrakech', country: 'Morocco',
      en: 'A labyrinth of golden light', es: 'Un laberinto de luz dorada'
    },
    {
      bg: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1920&q=80',
      place: 'Ubud', country: 'Bali',
      en: 'Serenity terraced above the clouds', es: 'Serenidad terrazada sobre las nubes'
    },
    {
      bg: 'https://images.unsplash.com/photo-1514282401047-065de7e0c79e?auto=format&fit=crop&w=1920&q=80',
      place: 'Maldives', country: 'Indian Ocean',
      en: 'Where time dissolves into turquoise', es: 'Donde el tiempo se disuelve en turquesa'
    }
  ];

  // ============================================================
  //  QUESTIONS DEFINITION
  // ============================================================
  const QUESTIONS = [
    {
      id: 'origin',
      type: 'text',
      en: { q: 'Where are you departing from?', hint: 'Your city and country of departure.', placeholder: 'e.g. Buenos Aires, Argentina' },
      es: { q: '¿Desde dónde salís?', hint: 'Tu ciudad y país de salida.', placeholder: 'ej. Buenos Aires, Argentina' },
      required: true
    },
    {
      id: 'passport',
      type: 'text',
      en: { q: 'What passport do you travel with?', hint: 'This helps us check visa requirements for you.', placeholder: 'e.g. Argentine, Spanish, American…' },
      es: { q: '¿Con qué pasaporte viajás?', hint: 'Esto nos ayuda a verificar requisitos de visa para vos.', placeholder: 'ej. Argentino, Español, Americano…' },
      required: true
    },
    {
      id: 'gender',
      type: 'radio',
      en: { q: 'How do you identify?', hint: 'Helps us flag safety considerations at certain destinations.' },
      es: { q: '¿Cómo te identificás?', hint: 'Nos ayuda a considerar la seguridad en ciertos destinos.' },
      required: false,
      options: [
        { value: 'female',     en: 'Female',             es: 'Femenino' },
        { value: 'male',       en: 'Male',               es: 'Masculino' },
        { value: 'prefer-not', en: 'Prefer not to say',  es: 'Prefiero no decirlo' }
      ]
    },
    {
      id: 'age',
      type: 'radio',
      en: { q: 'Your age range?' },
      es: { q: '¿Tu rango de edad?' },
      required: true,
      options: [
        { value: '18-25', en: '18 – 25', es: '18 – 25' },
        { value: '26-35', en: '26 – 35', es: '26 – 35' },
        { value: '36-45', en: '36 – 45', es: '36 – 45' },
        { value: '46-55', en: '46 – 55', es: '46 – 55' },
        { value: '55+',   en: '55 +',    es: '55 +' }
      ]
    },
    {
      id: 'companions',
      type: 'checkbox',
      en: { q: 'Who are you traveling with?', hint: 'Select all that apply.' },
      es: { q: '¿Con quién viajás?', hint: 'Podés elegir más de uno.' },
      required: true,
      options: [
        { value: 'solo',     en: 'Solo',                   es: 'Solo/a' },
        { value: 'couple',   en: 'As a couple',            es: 'En pareja' },
        { value: 'family',   en: 'Family with children',   es: 'Familia con hijos' },
        { value: 'friends',  en: 'Group of friends',       es: 'Grupo de amigos' },
        { value: 'business', en: 'Business / colleagues',  es: 'Trabajo / colegas' }
      ]
    },
    {
      id: 'tripType',
      type: 'radio',
      en: { q: 'Domestic or international trip?' },
      es: { q: '¿Viaje nacional o internacional?' },
      required: true,
      options: [
        { value: 'domestic',      en: 'Domestic',        es: 'Nacional' },
        { value: 'international', en: 'International',   es: 'Internacional' },
        { value: 'both',          en: 'Open to either',  es: 'Abierto a cualquiera' }
      ]
    },
    {
      id: 'dates',
      type: 'daterange',
      en: { q: 'When are you thinking of traveling?', hint: 'Approximate dates are fine.', labelFrom: 'Departure', labelTo: 'Return' },
      es: { q: '¿Cuándo planeás viajar?', hint: 'Fechas aproximadas están bien.', labelFrom: 'Salida', labelTo: 'Regreso' },
      required: false
    },
    {
      id: 'budget',
      type: 'radio',
      en: { q: 'Budget per person — excluding flights?', hint: 'This covers accommodation, food, and experiences.' },
      es: { q: '¿Presupuesto por persona, sin vuelos?', hint: 'Incluye alojamiento, comida y experiencias.' },
      required: true,
      options: [
        { value: 'economy',  en: 'Economy — Under $1,000',    es: 'Económico — Menos de $1.000' },
        { value: 'standard', en: 'Standard — $1,000 – $3,000', es: 'Estándar — $1.000 – $3.000' },
        { value: 'premium',  en: 'Premium — $3,000 – $8,000',  es: 'Premium — $3.000 – $8.000' },
        { value: 'luxury',   en: 'Luxury — $8,000+',           es: 'Lujo — $8.000+' }
      ]
    },
    {
      id: 'duration',
      type: 'slider',
      en: { q: 'How many days?', unit: 'days', unitSingular: 'day' },
      es: { q: '¿Cuántos días?', unit: 'días', unitSingular: 'día' },
      required: true,
      min: 1, max: 30, defaultVal: 7
    },
    {
      id: 'hasDestination',
      type: 'radio',
      en: { q: 'Do you have a destination in mind?', hint: 'No idea? We love that. We\'ll find your perfect match.' },
      es: { q: '¿Tenés un destino en mente?', hint: '¿Sin idea? Perfecto. Nosotros lo encontramos.' },
      required: true,
      options: [
        { value: 'yes', en: 'Yes — I have one in mind', es: 'Sí — tengo uno en mente' },
        { value: 'no',  en: 'Surprise me',              es: 'Sorprendeme' }
      ]
    },
    {
      id: 'destination',
      type: 'text',
      conditional: function (a) { return a.hasDestination === 'yes'; },
      en: { q: 'Which destination?', hint: 'Be as specific or vague as you like.', placeholder: 'e.g. Japan, Patagonia, Morocco, Portugal…' },
      es: { q: '¿A qué destino?', hint: 'Tan específico o vago como quieras.', placeholder: 'ej. Japón, Patagonia, Marruecos, Portugal…' },
      required: true
    },
    {
      id: 'experiences',
      type: 'checkbox',
      en: { q: 'What kind of experiences are you seeking?', hint: 'Select all that call to you.' },
      es: { q: '¿Qué tipo de experiencias buscás?', hint: 'Elegí todas las que te llamen.' },
      required: true,
      options: [
        { value: 'beach',     en: 'Beach & Sun',           es: 'Playa & Sol',            icon: '○' },
        { value: 'nature',    en: 'Nature & Wildlife',     es: 'Naturaleza & Fauna',     icon: '◇' },
        { value: 'culture',   en: 'Culture & History',     es: 'Cultura & Historia',     icon: '△' },
        { value: 'gastronomy',en: 'Gastronomy',            es: 'Gastronomía',            icon: '◈' },
        { value: 'winter',    en: 'Winter Sports',         es: 'Deportes de Invierno',   icon: '❄' },
        { value: 'surf',      en: 'Surf & Water Sports',   es: 'Surf & Deportes Acuáticos', icon: '〜' },
        { value: 'wellness',  en: 'Wellness & Spa',        es: 'Wellness & Spa',         icon: '◻' },
        { value: 'urban',     en: 'Urban Exploration',     es: 'Exploración Urbana',     icon: '⊞' },
        { value: 'safari',    en: 'Safari & Wildlife',     es: 'Safari & Fauna Salvaje', icon: '⊕' },
        { value: 'adventure', en: 'Adventure Sports',      es: 'Deportes de Aventura',   icon: '▲' },
        { value: 'festivals', en: 'Festivals & Events',    es: 'Festivales & Eventos',   icon: '◆' },
        { value: 'luxury',    en: 'Pure Luxury',           es: 'Lujo Puro',              icon: '✦' }
      ]
    },
    {
      id: 'sport',
      type: 'select',
      conditional: function (a) {
        return Array.isArray(a.experiences) && (
          a.experiences.includes('winter') ||
          a.experiences.includes('surf') ||
          a.experiences.includes('adventure')
        );
      },
      en: { q: 'Which sport specifically?', hint: 'We\'ll find the best spots for your level.', placeholder: 'Select a sport…' },
      es: { q: '¿Qué deporte en particular?', hint: 'Encontramos los mejores spots para tu nivel.', placeholder: 'Elegí un deporte…' },
      required: false,
      options: [
        { value: 'surf',       en: 'Surfing',         es: 'Surf' },
        { value: 'diving',     en: 'Scuba Diving',    es: 'Buceo' },
        { value: 'kitesurf',   en: 'Kitesurfing',     es: 'Kitesurf' },
        { value: 'ski',        en: 'Alpine Skiing',   es: 'Ski Alpino' },
        { value: 'snowboard',  en: 'Snowboarding',    es: 'Snowboard' },
        { value: 'trekking',   en: 'Trekking',        es: 'Trekking' },
        { value: 'climbing',   en: 'Rock Climbing',   es: 'Escalada' },
        { value: 'mtb',        en: 'Mountain Biking', es: 'MTB' },
        { value: 'paragliding',en: 'Paragliding',     es: 'Parapente' },
        { value: 'kayak',      en: 'Kayaking',        es: 'Kayak' }
      ]
    },
    {
      id: 'skillLevel',
      type: 'radio',
      conditional: function (a) { return !!a.sport; },
      en: { q: 'Your skill level in this sport?' },
      es: { q: '¿Tu nivel en ese deporte?' },
      required: true,
      options: [
        { value: 'beginner',     en: 'Beginner — First time or nearly',  es: 'Principiante — Primera vez o casi' },
        { value: 'intermediate', en: 'Intermediate — Some experience',   es: 'Intermedio — Algo de experiencia' },
        { value: 'advanced',     en: 'Advanced — Confident & competent', es: 'Avanzado — Seguro/a y competente' },
        { value: 'expert',       en: 'Expert — Professional level',      es: 'Experto/a — Nivel profesional' }
      ]
    },
    {
      id: 'visited',
      type: 'checkbox',
      en: { q: 'Regions you\'ve already explored?', hint: 'We\'ll steer you somewhere new. Skip if you\'re open.' },
      es: { q: '¿Regiones que ya conociste?', hint: 'Te llevamos a algo nuevo. Omití si estás abierto.' },
      required: false,
      options: [
        { value: 'europe',       en: 'Europe',         es: 'Europa' },
        { value: 'north-america',en: 'North America',  es: 'Norteamérica' },
        { value: 'south-america',en: 'South America',  es: 'Sudamérica' },
        { value: 'asia',         en: 'Asia',           es: 'Asia' },
        { value: 'africa',       en: 'Africa',         es: 'África' },
        { value: 'middle-east',  en: 'Middle East',    es: 'Medio Oriente' },
        { value: 'oceania',      en: 'Oceania',        es: 'Oceanía' },
        { value: 'caribbean',    en: 'Caribbean',      es: 'Caribe' }
      ]
    },
    {
      id: 'avoid',
      type: 'checkbox',
      en: { q: 'Anything you\'d rather avoid?', hint: 'Skip if everything\'s on the table.' },
      es: { q: '¿Algo que preferís evitar?', hint: 'Omití si todo está sobre la mesa.' },
      required: false,
      options: [
        { value: 'crowds',      en: 'Crowds & tourist traps',  es: 'Multitudes y lugares turísticos' },
        { value: 'long-flights',en: 'Very long flights (12h+)', es: 'Vuelos muy largos (12h+)' },
        { value: 'heat',        en: 'Extreme heat',             es: 'Calor extremo' },
        { value: 'cold',        en: 'Cold weather',             es: 'Clima frío' },
        { value: 'beach',       en: 'Beach & sun',              es: 'Playa y sol' },
        { value: 'cities',      en: 'Big cities',               es: 'Grandes ciudades' },
        { value: 'adventure',   en: 'Physical challenges',      es: 'Desafíos físicos' },
        { value: 'party',       en: 'Party scene / nightlife',  es: 'Fiesta / vida nocturna' }
      ]
    },
    {
      id: 'accommodation',
      type: 'checkbox',
      en: { q: 'Preferred accommodation style?', hint: 'Select all that work for you.' },
      es: { q: '¿Qué estilo de alojamiento preferís?', hint: 'Elegí todas las que te funcionan.' },
      required: true,
      options: [
        { value: 'hotel',      en: 'Hotel',             es: 'Hotel' },
        { value: 'boutique',   en: 'Boutique Hotel',    es: 'Hotel Boutique' },
        { value: 'hostel',     en: 'Hostel — social',   es: 'Hostel — social' },
        { value: 'apartment',  en: 'Apartment / Airbnb', es: 'Departamento / Airbnb' },
        { value: 'resort',     en: 'Resort',            es: 'Resort' },
        { value: 'glamping',   en: 'Glamping / Eco lodge', es: 'Glamping / Eco lodge' },
        { value: 'cruise',     en: 'Cruise',            es: 'Crucero' }
      ]
    },
    {
      id: 'travelStyle',
      type: 'checkbox',
      en: { q: 'How do you like to travel?', hint: 'Choose all that resonate.' },
      es: { q: '¿Cómo te gusta viajar?', hint: 'Elegí todas las que te representen.' },
      required: false,
      options: [
        { value: 'slow',        en: 'Slow travel',        es: 'Viaje lento' },
        { value: 'packed',      en: 'Packed itinerary',   es: 'Itinerario completo' },
        { value: 'spontaneous', en: 'Spontaneous',        es: 'Espontáneo' },
        { value: 'planned',     en: 'Well planned',       es: 'Bien planificado' },
        { value: 'eco',         en: 'Eco-conscious',      es: 'Eco-consciente' },
        { value: 'local',       en: 'Local immersion',    es: 'Inmersión local' },
        { value: 'luxury',      en: 'Luxury',             es: 'Lujo' },
        { value: 'value',       en: 'Value-focused',      es: 'Enfocado en valor' }
      ]
    },
    {
      id: 'notes',
      type: 'textarea',
      en: { q: 'Anything else your concierge should know?', hint: 'Dietary needs, mobility, anniversaries, dream wishes — entirely optional.', placeholder: 'Write anything that matters to you…' },
      es: { q: '¿Algo más que tu concierge deba saber?', hint: 'Restricciones alimentarias, movilidad, aniversarios, deseos especiales — totalmente opcional.', placeholder: 'Escribí lo que importa para vos…' },
      required: false
    }
  ];

  // ============================================================
  //  HELPERS
  // ============================================================
  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn('[Weygo:' + name + ']', e); }
  }

  function t(q, field) {
    return (q[lang] && q[lang][field]) || (q['en'] && q['en'][field]) || '';
  }

  function el(id) { return document.getElementById(id); }

  function updateLangAttr() {
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
    document.querySelectorAll('[data-en]').forEach(function (node) {
      node.textContent = lang === 'en' ? node.dataset.en : (node.dataset.es || node.dataset.en);
    });
    el('lang-toggle').textContent = lang === 'en' ? 'ES' : 'EN';
  }

  // ============================================================
  //  API KEY MANAGEMENT
  // ============================================================
  function getApiKey() { return localStorage.getItem('weygo_api_key') || ''; }
  function setApiKey(key) { localStorage.setItem('weygo_api_key', key); }

  function initApiModal() {
    var modal = el('api-modal');
    var saveBtn = el('api-key-save');
    var input = el('api-key-input');

    // On Vercel: key lives in the server — never ask the user
    if (isDeployed()) {
      modal.setAttribute('hidden', '');
      el('settings-btn').style.display = 'none';
      return;
    }

    if (!getApiKey()) {
      modal.removeAttribute('hidden');
    }

    saveBtn.addEventListener('click', function () {
      var key = input.value.trim();
      if (!key || !key.startsWith('sk-')) {
        input.style.borderColor = 'var(--danger)';
        return;
      }
      setApiKey(key);
      modal.setAttribute('hidden', '');
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') saveBtn.click();
    });
    input.addEventListener('input', function () {
      input.style.borderColor = '';
    });

    el('settings-btn').addEventListener('click', function () {
      input.value = getApiKey();
      modal.removeAttribute('hidden');
    });
  }

  // ============================================================
  //  LANDING SCREEN
  // ============================================================
  function initLanding() {
    // Build landing slideshow
    var lsContainer = el('landing-slides');
    SLIDES.forEach(function (s, i) {
      var slide = document.createElement('div');
      slide.className = 'landing-slide' + (i === 0 ? ' is-active' : '');
      slide.style.backgroundImage = 'url(' + s.bg + ')';
      lsContainer.appendChild(slide);
    });
    updateLandingCaption(0);

    // Lang toggle on landing
    el('landing-lang').addEventListener('click', function () {
      lang = lang === 'en' ? 'es' : 'en';
      updateLangAttr();
      updateLandingLangBtn();
      updateLandingCaption(currentSlide);
      updateLandingText();
    });

    // CTA: transition to quiz
    el('landing-start').addEventListener('click', function () {
      if (isDeployed()) { hideLanding(); return; }
      var apiKey = getApiKey();
      if (!apiKey) {
        el('api-modal').removeAttribute('hidden');
        el('api-key-save').addEventListener('click', function onSave() {
          if (getApiKey()) {
            el('api-key-save').removeEventListener('click', onSave);
            hideLanding();
          }
        }, { once: true });
        return;
      }
      hideLanding();
    });
  }

  function hideLanding() {
    var ls = el('landing-screen');
    ls.classList.add('is-leaving');
    setTimeout(function () {
      ls.setAttribute('hidden', '');
      el('app').removeAttribute('hidden');
    }, 600);
  }

  function updateLandingLangBtn() {
    el('landing-lang').textContent = lang === 'en' ? 'ES' : 'EN';
  }

  function updateLandingCaption(idx) {
    var s = SLIDES[idx];
    var placeEl = el('lc-place');
    var countryEl = el('lc-country');
    var taglineEl = el('lc-tagline');
    if (placeEl) placeEl.textContent = s.place;
    if (countryEl) countryEl.textContent = s.country;
    if (taglineEl) taglineEl.textContent = lang === 'en' ? s.en : (s.es || s.en);
  }

  function updateLandingText() {
    // Re-render data-en/data-es nodes inside landing
    var ls = el('landing-screen');
    if (!ls) return;
    ls.querySelectorAll('[data-en]').forEach(function (node) {
      node.innerHTML = lang === 'en' ? node.dataset.en : (node.dataset.es || node.dataset.en);
    });
  }

  // ============================================================
  //  SLIDESHOW (quiz panel)
  // ============================================================
  function initSlideshow() {
    var container = el('slides-container');
    var dotsEl = el('slide-dots');

    SLIDES.forEach(function (s, i) {
      var slide = document.createElement('div');
      slide.className = 'slide' + (i === 0 ? ' is-active' : '');
      slide.style.backgroundImage = 'url(' + s.bg + ')';
      container.appendChild(slide);

      var dot = document.createElement('button');
      dot.className = 'slide-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      dot.addEventListener('click', function () { goToSlide(i); });
      dotsEl.appendChild(dot);
    });

    updateSlideCaption(0);
    startSlideshowTimer();
  }

  function goToSlide(idx) {
    // Update quiz slideshow
    var slides = el('slides-container').querySelectorAll('.slide');
    var dots = el('slide-dots').querySelectorAll('.slide-dot');
    slides[currentSlide].classList.remove('is-active');
    dots[currentSlide].classList.remove('is-active');
    currentSlide = (idx + SLIDES.length) % SLIDES.length;
    slides[currentSlide].classList.add('is-active');
    dots[currentSlide].classList.add('is-active');
    updateSlideCaption(currentSlide);

    // Also advance landing slideshow if still visible
    var landingSlides = el('landing-slides');
    if (landingSlides) {
      landingSlides.querySelectorAll('.landing-slide').forEach(function (s, i) {
        s.classList.toggle('is-active', i === currentSlide);
      });
      updateLandingCaption(currentSlide);
    }
  }

  function updateSlideCaption(idx) {
    var s = SLIDES[idx];
    el('slide-place').textContent = s.place;
    el('slide-country').textContent = s.country;
    el('slide-tagline').textContent = lang === 'en' ? s.en : (s.es || s.en);
  }

  function startSlideshowTimer() {
    clearInterval(slideshowTimer);
    slideshowTimer = setInterval(function () {
      goToSlide(currentSlide + 1);
    }, 5000);
  }

  function stopSlideshow() {
    clearInterval(slideshowTimer);
  }

  // ============================================================
  //  QUESTION VISIBILITY
  // ============================================================
  function computeVisible() {
    visibleQuestions = QUESTIONS.filter(function (q) {
      if (typeof q.conditional === 'function') {
        return q.conditional(answers);
      }
      return true;
    });
  }

  // ============================================================
  //  RENDER QUESTION
  // ============================================================
  function renderQuestion() {
    computeVisible();
    var q = visibleQuestions[currentIdx];
    if (!q) return;

    var body = el('quiz-body');
    var total = visibleQuestions.length;
    var num = currentIdx + 1;

    // Progress
    el('progress-fill').style.width = Math.round((num / total) * 100) + '%';
    var ptxt = el('progress-text');
    ptxt.dataset.en = 'Question ' + num;
    ptxt.dataset.es = 'Pregunta ' + num;
    ptxt.textContent = lang === 'en' ? 'Question ' + num : 'Pregunta ' + num;
    el('progress-fraction').textContent = num + ' / ' + total;

    var qHint = t(q, 'hint');
    var html = '<div class="question-wrap">';
    html += '<p class="question-number">' + (lang === 'en' ? 'Question' : 'Pregunta') + ' ' + num + '</p>';
    html += '<h2 class="question-text">' + esc(t(q, 'q')) + '</h2>';
    if (qHint) html += '<p class="question-hint">' + esc(qHint) + '</p>';

    switch (q.type) {
      case 'radio':    html += renderRadio(q);     break;
      case 'checkbox': html += renderCheckbox(q);  break;
      case 'slider':   html += renderSlider(q);    break;
      case 'text':     html += renderText(q);      break;
      case 'select':   html += renderSelect(q);    break;
      case 'daterange':html += renderDaterange(q); break;
      case 'textarea': html += renderTextarea(q);  break;
    }

    html += '<p class="field-error" id="field-error">' + (lang === 'en' ? 'Please answer this question to continue.' : 'Por favor respondé esta pregunta para continuar.') + '</p>';
    html += '</div>';

    body.innerHTML = html;
    body.scrollTop = 0;

    // Wire up dynamic behaviours
    if (q.type === 'slider') wireSlider(q);
    wireCheckboxes(q);
  }

  function renderRadio(q) {
    var html = '<div class="options-list">';
    q.options.forEach(function (opt) {
      var checked = answers[q.id] === opt.value ? 'checked' : '';
      var label = lang === 'en' ? opt.en : (opt.es || opt.en);
      html += '<div class="option-item">';
      html += '<input type="radio" name="' + q.id + '" id="opt-' + opt.value + '" value="' + esc(opt.value) + '" ' + checked + '>';
      html += '<label class="option-label" for="opt-' + opt.value + '">';
      html += '<span class="option-indicator"></span>';
      html += '<span class="option-text">' + esc(label) + '</span>';
      html += '</label></div>';
    });
    html += '</div>';
    return html;
  }

  function renderCheckbox(q) {
    var html = '<div class="options-list">';
    var saved = answers[q.id] || [];
    q.options.forEach(function (opt) {
      var checked = saved.includes(opt.value) ? 'checked' : '';
      var label = lang === 'en' ? opt.en : (opt.es || opt.en);
      html += '<div class="option-item">';
      html += '<input type="checkbox" name="' + q.id + '" id="opt-' + opt.value + '" value="' + esc(opt.value) + '" ' + checked + '>';
      html += '<label class="option-label" for="opt-' + opt.value + '">';
      html += '<span class="option-indicator"></span>';
      if (opt.icon) html += '<span class="option-icon">' + opt.icon + '</span>';
      html += '<span class="option-text">' + esc(label) + '</span>';
      html += '</label></div>';
    });
    html += '</div>';
    return html;
  }

  function renderSlider(q) {
    var val = answers[q.id] !== undefined ? answers[q.id] : q.defaultVal;
    var unit = lang === 'en' ? (val === 1 ? q.en.unitSingular : q.en.unit) : (val === 1 ? q.es.unitSingular : q.es.unit);
    var html = '<div class="slider-wrap">';
    html += '<div class="slider-value-display" id="slider-display">' + val + '</div>';
    html += '<div class="slider-unit" id="slider-unit">' + esc(unit) + '</div>';
    html += '<input type="range" id="slider-input" min="' + q.min + '" max="' + q.max + '" value="' + val + '">';
    html += '<div class="slider-labels"><span>' + q.min + '</span><span>' + q.max + '</span></div>';
    html += '</div>';
    return html;
  }

  function renderText(q) {
    var val = answers[q.id] || '';
    return '<div class="text-input-wrap"><input type="text" id="text-input" placeholder="' + esc(t(q, 'placeholder')) + '" value="' + esc(val) + '" autocomplete="off"></div>';
  }

  function renderSelect(q) {
    var val = answers[q.id] || '';
    var placeholder = t(q, 'placeholder');
    var html = '<div class="select-wrap"><select id="select-input">';
    html += '<option value="">' + esc(placeholder) + '</option>';
    q.options.forEach(function (opt) {
      var label = lang === 'en' ? opt.en : (opt.es || opt.en);
      var sel = val === opt.value ? 'selected' : '';
      html += '<option value="' + esc(opt.value) + '" ' + sel + '>' + esc(label) + '</option>';
    });
    html += '</select></div>';
    return html;
  }

  function renderDaterange(q) {
    var f = answers[q.id + '_from'] || '';
    var t2 = answers[q.id + '_to'] || '';
    var lf = lang === 'en' ? q.en.labelFrom : q.es.labelFrom;
    var lt = lang === 'en' ? q.en.labelTo : q.es.labelTo;
    var html = '<div class="daterange-wrap">';
    html += '<div class="date-field"><label>' + esc(lf) + '</label><input type="date" id="date-from" value="' + esc(f) + '"></div>';
    html += '<div class="date-field"><label>' + esc(lt) + '</label><input type="date" id="date-to" value="' + esc(t2) + '"></div>';
    html += '</div>';
    return html;
  }

  function renderTextarea(q) {
    var val = answers[q.id] || '';
    return '<div class="text-input-wrap"><textarea id="textarea-input" placeholder="' + esc(t(q, 'placeholder')) + '">' + esc(val) + '</textarea></div>';
  }

  function wireSlider(q) {
    var inp = el('slider-input');
    var disp = el('slider-display');
    var unitEl = el('slider-unit');
    if (!inp) return;
    function update() {
      var v = parseInt(inp.value, 10);
      disp.textContent = v;
      var unit = lang === 'en' ? (v === 1 ? q.en.unitSingular : q.en.unit) : (v === 1 ? q.es.unitSingular : q.es.unit);
      unitEl.textContent = unit;
      answers[q.id] = v;
    }
    inp.addEventListener('input', update);
    update();
  }

  function wireCheckboxes(q) {
    if (q.type !== 'checkbox') return;
    el('quiz-body').querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var checked = Array.from(el('quiz-body').querySelectorAll('input[type="checkbox"]:checked')).map(function (c) { return c.value; });
        answers[q.id] = checked;
      });
    });
  }

  // ============================================================
  //  COLLECT ANSWER FROM CURRENT FIELD
  // ============================================================
  function collectAnswer() {
    var q = visibleQuestions[currentIdx];
    if (!q) return true;

    switch (q.type) {
      case 'radio': {
        var sel = el('quiz-body').querySelector('input[type="radio"]:checked');
        if (sel) answers[q.id] = sel.value;
        break;
      }
      case 'checkbox': {
        var checked = Array.from(el('quiz-body').querySelectorAll('input[type="checkbox"]:checked')).map(function (c) { return c.value; });
        answers[q.id] = checked;
        break;
      }
      case 'slider': {
        var inp = el('slider-input');
        if (inp) answers[q.id] = parseInt(inp.value, 10);
        break;
      }
      case 'text': {
        var inp2 = el('text-input');
        if (inp2) answers[q.id] = inp2.value.trim();
        break;
      }
      case 'select': {
        var sel2 = el('select-input');
        if (sel2) answers[q.id] = sel2.value;
        break;
      }
      case 'daterange': {
        var df = el('date-from');
        var dt = el('date-to');
        if (df) answers[q.id + '_from'] = df.value;
        if (dt) answers[q.id + '_to'] = dt.value;
        break;
      }
      case 'textarea': {
        var ta = el('textarea-input');
        if (ta) answers[q.id] = ta.value.trim();
        break;
      }
    }
    return true;
  }

  function validate() {
    var q = visibleQuestions[currentIdx];
    if (!q || !q.required) return true;

    var a = answers[q.id];
    if (q.type === 'checkbox') {
      if (!a || a.length === 0) { showError(); return false; }
    } else if (q.type === 'radio' || q.type === 'select') {
      if (!a) { showError(); return false; }
    } else if (q.type === 'text') {
      if (!a || a === '') { showError(); return false; }
    } else if (q.type === 'slider') {
      if (a === undefined || a === null) { showError(); return false; }
    }
    return true;
  }

  function showError() {
    var err = el('field-error');
    if (err) {
      err.textContent = lang === 'en' ? 'Please answer this question to continue.' : 'Por favor respondé esta pregunta para continuar.';
      err.classList.add('visible');
    }
  }

  // ============================================================
  //  NAVIGATION
  // ============================================================
  function initNav() {
    el('btn-continue').addEventListener('click', function () {
      // Anchor by question ID — survives array resizes from conditional questions
      var currentId = visibleQuestions[currentIdx] ? visibleQuestions[currentIdx].id : null;
      collectAnswer();
      if (!validate()) return;
      computeVisible();
      // Find where the current question landed in the new list
      var newIdx = currentId
        ? visibleQuestions.findIndex(function (q) { return q.id === currentId; })
        : currentIdx;
      if (newIdx < 0) newIdx = currentIdx;
      if (newIdx >= visibleQuestions.length - 1) {
        submitQuiz();
      } else {
        currentIdx = newIdx + 1;
        el('btn-back').disabled = false;
        renderQuestion();
      }
    });

    el('btn-back').addEventListener('click', function () {
      var currentId = visibleQuestions[currentIdx] ? visibleQuestions[currentIdx].id : null;
      collectAnswer();
      computeVisible();
      var newIdx = currentId
        ? visibleQuestions.findIndex(function (q) { return q.id === currentId; })
        : currentIdx;
      if (newIdx < 0) newIdx = currentIdx;
      if (newIdx > 0) {
        currentIdx = newIdx - 1;
        renderQuestion();
        el('btn-back').disabled = currentIdx === 0;
      }
    });

    // Allow Enter on text inputs to advance
    el('quiz-body').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.target.tagName === 'INPUT')) {
        el('btn-continue').click();
      }
    });
  }

  // ============================================================
  //  SUBMIT → AI CALL
  // ============================================================
  function submitQuiz() {
    if (isSubmitting) return;   // block double-fire
    var apiKey = getApiKey();

    // On Vercel the key lives server-side — skip local key check
    if (!isDeployed() && !apiKey) {
      el('api-modal').removeAttribute('hidden');
      isSubmitting = false;
      return;
    }

    isSubmitting = true;

    // Switch to loading state
    stopSlideshow();
    el('slideshow').style.display = 'none';
    el('loading-screen').removeAttribute('hidden');
    var btnCont = el('btn-continue');
    if (btnCont) { btnCont.disabled = true; btnCont.classList.add('is-loading'); btnCont.onclick = null; }

    // Build continue button label for result (btn may have been replaced by renderError)
    var bcont = el('btn-continue');
    if (bcont) bcont.querySelectorAll('[data-en]').forEach(function (n) {
      n.dataset.en = 'Plan another trip'; n.dataset.es = 'Planear otro viaje';
      n.textContent = lang === 'en' ? 'Plan another trip' : 'Planear otro viaje';
    });

    var prompt = buildPrompt();
    callClaude(apiKey, prompt);
  }

  function buildPrompt() {
    var a = answers;
    var lines = [];

    lines.push('TRAVELER PROFILE:');
    lines.push('- Departure city: ' + (a.origin || 'not specified'));
    lines.push('- Passport/nationality: ' + (a.passport || 'not specified'));
    lines.push('- Gender: ' + (a.gender || 'not specified'));
    lines.push('- Age range: ' + (a.age || 'not specified'));
    lines.push('- Travel companions: ' + (Array.isArray(a.companions) ? a.companions.join(', ') : (a.companions || 'not specified')));
    lines.push('- Trip type: ' + (a.tripType || 'not specified'));
    lines.push('- Departure date: ' + (a.dates_from || 'flexible'));
    lines.push('- Return date: ' + (a.dates_to || 'flexible'));
    lines.push('- Budget per person (excl. flights): ' + (a.budget || 'not specified'));
    lines.push('- Duration: ' + (a.duration ? a.duration + ' days' : 'not specified'));
    lines.push('- Has destination in mind: ' + (a.hasDestination || 'no'));
    if (a.destination) lines.push('- Preferred destination: ' + a.destination);
    lines.push('- Experiences sought: ' + (Array.isArray(a.experiences) ? a.experiences.join(', ') : 'not specified'));
    if (a.sport) lines.push('- Specific sport: ' + a.sport);
    if (a.skillLevel) lines.push('- Skill level: ' + a.skillLevel);
    if (a.visited && a.visited.length) lines.push('- Already visited regions: ' + a.visited.join(', '));
    if (a.avoid && a.avoid.length) lines.push('- Wants to avoid: ' + a.avoid.join(', '));
    lines.push('- Accommodation preference: ' + (a.accommodation || 'not specified'));
    lines.push('- Travel style: ' + (Array.isArray(a.travelStyle) ? a.travelStyle.join(', ') : (a.travelStyle || 'not specified')));
    if (a.notes) lines.push('- Special notes: ' + a.notes);

    var daysNum = a.duration || 7;
    var langNote = lang === 'en' ? 'English' : 'Spanish (Rioplatense)';

    return 'You are Weygo, an ultra-premium AI travel concierge. Create a deeply personalized trip itinerary based on this traveler\'s profile. Be specific, poetic, and genuinely insightful — not generic.\n\n' +
      lines.join('\n') + '\n\n' +
      'Respond ONLY with a valid JSON object in ' + langNote + ', using this exact schema:\n\n' +
      '{\n' +
      '  "destination": "City or Region, Country",\n' +
      '  "tagline": "A short poetic phrase (8-12 words) capturing the essence of this trip",\n' +
      '  "justification": "2-3 sentences explaining why this is perfect for THIS traveler based on their specific answers",\n' +
      '  "budget_estimate": "e.g. $2,500 – $4,000 per person (excl. flights)",\n' +
      '  "best_season": "Best time to visit and why (1-2 sentences)",\n' +
      '  "star_experience": "The single most special, unique experience for this traveler",\n' +
      '  "itinerary": [\n' +
      '    {\n' +
      '      "day": 1,\n' +
      '      "title": "Short evocative day title",\n' +
      '      "morning": "Specific morning activity with real place name",\n' +
      '      "afternoon": "Specific afternoon activity with real place name",\n' +
      '      "evening": "Specific evening activity with real place name",\n' +
      '      "stay": "Recommended neighborhood or hotel name"\n' +
      '    }\n' +
      '  ],\n' +
      '  "booking": {\n' +
      '    "flights": [{"name": "Platform", "url": "full URL with dates if possible", "note": "short tip"}],\n' +
      '    "hotels": [{"name": "Platform or property", "url": "full URL with dates if possible", "note": "short tip"}],\n' +
      '    "experiences": [{"name": "Experience or platform", "url": "URL", "note": "short tip"}],\n' +
      '    "transport": [{"name": "Transport option", "url": "URL", "note": "short tip"}],\n' +
      '    "insurance": [{"name": "Insurance provider", "url": "URL", "note": "short tip"}]\n' +
      '  },\n' +
      '  "sport_resources": [{"name": "Resource name", "url": "URL", "note": "short tip"}],\n' +
      '  "concierge_tips": ["Tip 1 with specific actionable advice", "Tip 2", "Tip 3", "Tip 4", "Tip 5"],\n' +
      '  "visa": "Visa info based on their passport for this destination",\n' +
      '  "alternatives": [\n' +
      '    {"destination": "City, Country", "tagline": "Short poetic phrase", "reason": "Why this also fits them"},\n' +
      '    {"destination": "City, Country", "tagline": "Short poetic phrase", "reason": "Why this also fits them"}\n' +
      '  ]\n' +
      '}\n\n' +
      'Generate exactly ' + daysNum + ' days in the itinerary. Use real, specific place names. For booking URLs, pre-fill dates (' + (a.dates_from || '') + ' to ' + (a.dates_to || '') + ') where the platform supports it (Booking.com, Airbnb, Skyscanner etc.).\n\n' +
      'CRITICAL RULES:\n' +
      '1. Visa and entry requirements MUST appear ONLY in the "visa" field. Do NOT mention visas, ESTA, entry permits, or passport requirements anywhere else (not in justification, concierge_tips, itinerary, or any other field).\n' +
      '2. The "concierge_tips" must be practical local tips only (what to pack, best transport, local etiquette, currency, safety, seasonal advice) — never visa info.\n' +
      '3. Return ONLY the JSON — no markdown, no explanation.';
  }

  function callClaude(apiKey, prompt) {
    var payload = {
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      stream: true,
      messages: [{ role: 'user', content: prompt }]
    };

    var url, headers;
    if (isDeployed()) {
      url = '/api/chat';
      headers = { 'Content-Type': 'application/json' };
    } else {
      url = 'https://api.anthropic.com/v1/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      };
    }

    fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(payload) })
    .then(function (res) {
      if (res.status === 401) throw Object.assign(new Error('auth'), { isAuth: true });
      if (!res.ok) {
        return res.json().then(function (b) {
          throw new Error((b.error && b.error.message) || 'HTTP ' + res.status);
        }).catch(function (e) { if (e.isAuth) throw e; throw new Error('HTTP ' + res.status); });
      }
      return readStream(res);
    })
    .then(function (text) {
      if (!text) throw new Error('Empty response from AI.');
      var cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      var result = JSON.parse(cleaned);
      renderResult(result);
    })
    .catch(function (err) {
      console.error('[Weygo] API error:', err);
      if (err.isAuth) {
        renderAuthError();
      } else {
        renderError(err.message || 'Unknown error');
      }
    });
  }

  // Reads a streaming SSE response from Anthropic and returns the full text
  function readStream(response) {
    return new Promise(function (resolve, reject) {
      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var fullText = '';
      var buffer = '';

      function read() {
        reader.read().then(function (result) {
          if (result.done) { resolve(fullText); return; }

          buffer += decoder.decode(result.value, { stream: true });
          var lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete last line

          lines.forEach(function (line) {
            if (!line.startsWith('data: ')) return;
            var data = line.slice(6).trim();
            if (data === '[DONE]') return;
            try {
              var evt = JSON.parse(data);
              if (evt.type === 'content_block_delta' && evt.delta && evt.delta.text) {
                fullText += evt.delta.text;
              }
              // Non-streaming fallback: plain message response
              if (evt.content && evt.content[0] && evt.content[0].text) {
                fullText = evt.content[0].text;
              }
            } catch (e) {}
          });

          read();
        }).catch(reject);
      }

      read();
    });
  }

  function renderAuthError() {
    isSubmitting = false;
    el('loading-screen').setAttribute('hidden', '');
    el('slideshow').style.display = '';
    startSlideshowTimer();
    el('btn-continue').disabled = false;
    el('btn-continue').classList.remove('is-loading');

    var isEs = lang === 'es';
    var body = el('quiz-body');
    body.innerHTML = '<div class="question-wrap">' +
      '<div class="error-box">' +
      '<strong>' + (isEs ? 'API key inválida' : 'Invalid API key') + '</strong>' +
      (isEs
        ? 'Anthropic rechazó la clave. Verificá que la copiaste correctamente desde <strong>console.anthropic.com</strong>.'
        : 'Anthropic rejected your key. Make sure you copied it correctly from <strong>console.anthropic.com</strong>.') +
      '</div></div>';

    // Restore continue button
    el('btn-continue').querySelectorAll('[data-en]').forEach(function (n) {
      n.dataset.en = 'Update API key'; n.dataset.es = 'Actualizar clave';
      n.textContent = isEs ? 'Actualizar clave' : 'Update API key';
    });
    el('btn-continue').onclick = function () {
      el('api-key-input').value = '';
      el('api-modal').removeAttribute('hidden');
      el('api-key-input').focus();
      el('btn-continue').onclick = null;
    };
  }

  // ============================================================
  //  RENDER RESULT
  // ============================================================
  function renderResult(data) {
    isSubmitting = false;
    currentItinerary = data;

    // Hide loading, show result
    var loadingEl = el('loading-screen');
    if (loadingEl) loadingEl.setAttribute('hidden', '');
    var resultPanelEl = el('result-panel');
    if (resultPanelEl) resultPanelEl.removeAttribute('hidden');

    // Left panel: summary
    var panel = el('quiz-panel');
    if (panel) panel.classList.add('result-mode');

    var body = el('quiz-body');
    var lbl = lang === 'en' ? 'Your perfect journey' : 'Tu viaje perfecto';
    var budget = data.budget_estimate || '';
    var best = data.best_season || '';
    var star = data.star_experience || '';

    body.innerHTML = '<div class="result-summary">' +
      '<p class="rs-label">' + esc(lbl) + '</p>' +
      '<h2 class="rs-dest">' + esc(data.destination || '') + '</h2>' +
      '<p class="rs-tagline">' + esc(data.tagline || '') + '</p>' +
      '<div class="result-meta">' +
      (budget ? '<div class="result-meta-item"><span class="rmi-label">' + (lang==='en'?'Budget':'Presupuesto') + '</span><span class="rmi-value">' + esc(budget) + '</span></div>' : '') +
      (best ? '<div class="result-meta-item"><span class="rmi-label">' + (lang==='en'?'Best time':'Mejor época') + '</span><span class="rmi-value">' + esc(best.split('.')[0]) + '</span></div>' : '') +
      (star ? '<div class="result-meta-item"><span class="rmi-label">' + (lang==='en'?'Star exp.':'Estrella') + '</span><span class="rmi-value">' + esc(star) + '</span></div>' : '') +
      '</div></div>';

    // Footer: restart
    var footer = el('quiz-footer');
    footer.innerHTML = '<button class="btn-restart" id="btn-restart">' +
      (lang === 'en' ? '← Plan another trip' : '← Planear otro viaje') + '</button>';
    el('btn-restart').addEventListener('click', restartQuiz);

    // Right panel: full itinerary
    var rc = el('result-content');
    if (!rc) return;
    rc.innerHTML = buildResultHTML(data);

    // Wire accordions
    rc.querySelectorAll('.day-header').forEach(function (hdr) {
      hdr.addEventListener('click', function () {
        var item = hdr.closest('.day-item');
        item.classList.toggle('is-open');
      });
    });

    // Open first day
    var firstDay = rc.querySelector('.day-item');
    if (firstDay) firstDay.classList.add('is-open');

    // Wire download buttons
    var btnPrint = el('btn-print');
    if (btnPrint) btnPrint.addEventListener('click', function () { window.print(); });
    var btnDl = el('btn-download');
    if (btnDl) btnDl.addEventListener('click', function () { downloadItinerary(data); });

    el('result-panel').scrollTop = 0;
  }

  function buildResultHTML(d) {
    var h = '';

    // Download bar
    var dlLabel  = lang === 'en' ? '↓ Download itinerary' : '↓ Descargar itinerario';
    var prtLabel = lang === 'en' ? '⊙ Print / Save PDF'  : '⊙ Imprimir / PDF';
    h += '<div class="result-download-bar">';
    h += '<button id="btn-download" class="rdb-btn rdb-primary">' + dlLabel + '</button>';
    h += '<button id="btn-print"    class="rdb-btn rdb-ghost">'   + prtLabel + '</button>';
    h += '</div>';

    // Hero
    h += '<div class="result-hero">';
    h += '<p class="result-hero-label">' + (lang==='en'?'Your Weygo Itinerary':'Tu Itinerario Weygo') + '</p>';
    h += '<h1 class="result-destination">' + esc(d.destination || '') + '</h1>';
    h += '<p class="result-tagline-big">' + esc(d.tagline || '') + '</p>';
    if (d.justification) h += '<p class="result-justification">' + esc(d.justification) + '</p>';
    h += '</div>';

    // Stats
    h += '<div class="result-stats">';
    if (d.budget_estimate) h += '<div class="stat-item"><p class="stat-label">' + (lang==='en'?'Budget':'Presupuesto') + '</p><p class="stat-value">' + esc(d.budget_estimate) + '</p></div>';
    if (d.best_season) h += '<div class="stat-item"><p class="stat-label">' + (lang==='en'?'Best Season':'Mejor Época') + '</p><p class="stat-value">' + esc(d.best_season) + '</p></div>';
    if (d.star_experience) h += '<div class="stat-item"><p class="stat-label">' + (lang==='en'?'Star Experience':'Experiencia Estrella') + '</p><p class="stat-value">' + esc(d.star_experience) + '</p></div>';
    if (answers.duration) h += '<div class="stat-item"><p class="stat-label">' + (lang==='en'?'Duration':'Duración') + '</p><p class="stat-value">' + answers.duration + (lang==='en'?' days':' días') + '</p></div>';
    h += '</div>';

    // Itinerary
    if (d.itinerary && d.itinerary.length) {
      h += '<div class="result-section">';
      h += '<h3 class="result-section-title">' + (lang==='en'?'Day by Day':'Día a Día') + '</h3>';
      h += '<div class="itinerary-days">';
      d.itinerary.forEach(function (day) {
        h += '<div class="day-item">';
        h += '<div class="day-header">';
        h += '<span class="day-num">' + (lang==='en'?'Day ':'Día ') + (day.day || '') + '</span>';
        h += '<span class="day-title-text">' + esc(day.title || '') + '</span>';
        h += '<svg class="day-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="6 9 12 15 18 9"/></svg>';
        h += '</div>';
        h += '<div class="day-body">';
        if (day.morning) h += '<div class="day-slot"><p class="slot-time">' + (lang==='en'?'Morning':'Mañana') + '</p><p class="slot-activity">' + esc(day.morning) + '</p></div>';
        if (day.afternoon) h += '<div class="day-slot"><p class="slot-time">' + (lang==='en'?'Afternoon':'Tarde') + '</p><p class="slot-activity">' + esc(day.afternoon) + '</p></div>';
        if (day.evening) h += '<div class="day-slot"><p class="slot-time">' + (lang==='en'?'Evening':'Noche') + '</p><p class="slot-activity">' + esc(day.evening) + '</p></div>';
        if (day.stay) h += '<p class="day-stay"><strong>' + (lang==='en'?'Where to stay:':'Dónde quedarse:') + '</strong> ' + esc(day.stay) + '</p>';
        h += '</div></div>';
      });
      h += '</div></div>';
    }

    // Booking links
    if (d.booking) {
      h += '<div class="result-section">';
      h += '<h3 class="result-section-title">' + (lang==='en'?'Reserve Your Trip':'Reservá tu Viaje') + '</h3>';
      var cats = [
        { key: 'flights',     en: 'Flights',      es: 'Vuelos' },
        { key: 'hotels',      en: 'Accommodation', es: 'Alojamiento' },
        { key: 'experiences', en: 'Experiences',   es: 'Experiencias' },
        { key: 'transport',   en: 'Local Transport', es: 'Transporte Local' },
        { key: 'insurance',   en: 'Travel Insurance', es: 'Seguro de Viaje' }
      ];
      cats.forEach(function (cat) {
        var links = d.booking[cat.key];
        if (!links || !links.length) return;
        h += '<div class="booking-category">';
        h += '<p class="booking-cat-title">' + (lang==='en'?cat.en:cat.es) + '</p>';
        h += '<div class="booking-links-list">';
        links.forEach(function (lnk) {
          h += '<div class="booking-link-item">';
          h += '<a href="' + esc(lnk.url || '#') + '" target="_blank" rel="noopener">';
          h += '<div class="bli-info"><p class="bli-name">' + esc(lnk.name || '') + '</p>';
          if (lnk.note) h += '<p class="bli-note">' + esc(lnk.note) + '</p>';
          h += '</div><span class="bli-arrow">↗</span></a></div>';
        });
        h += '</div></div>';
      });
      h += '</div>';
    }

    // Sport resources
    if (d.sport_resources && d.sport_resources.length) {
      h += '<div class="result-section">';
      h += '<h3 class="result-section-title">' + (lang==='en'?'Sport Resources':'Recursos Deportivos') + '</h3>';
      h += '<div class="booking-links-list">';
      d.sport_resources.forEach(function (lnk) {
        h += '<div class="booking-link-item"><a href="' + esc(lnk.url || '#') + '" target="_blank" rel="noopener">';
        h += '<div class="bli-info"><p class="bli-name">' + esc(lnk.name || '') + '</p>';
        if (lnk.note) h += '<p class="bli-note">' + esc(lnk.note) + '</p>';
        h += '</div><span class="bli-arrow">↗</span></a></div>';
      });
      h += '</div></div>';
    }

    // Concierge tips
    if (d.concierge_tips && d.concierge_tips.length) {
      h += '<div class="result-section">';
      h += '<h3 class="result-section-title">' + (lang==='en'?'Concierge Tips':'Consejos del Concierge') + '</h3>';
      h += '<div class="tips-list">';
      d.concierge_tips.forEach(function (tip, i) {
        h += '<div class="tip-item"><span class="tip-num">0' + (i+1) + '</span><p class="tip-text">' + esc(tip) + '</p></div>';
      });
      h += '</div></div>';
    }

    // Visa
    var visaWarningEN = '⚠ This information is AI-generated and may be inaccurate or outdated. Always verify visa requirements with official sources before booking.';
    var visaWarningES = '⚠ Esta información es generada por IA y puede ser inexacta o estar desactualizada. Verificá siempre los requisitos de visa en fuentes oficiales antes de reservar.';
    var visaLinksEN = [
      { name: 'IATA Travel Centre (official visa checker)', url: 'https://www.iatatravelcentre.com/' },
      { name: 'Sherpa — Visa & entry requirements', url: 'https://apply.joinsherpa.com/travel-restrictions' },
      { name: 'Embassy / Consulate (search for your country)', url: 'https://www.embassy-worldwide.com/' }
    ];
    var visaLinksES = [
      { name: 'IATA Travel Centre (verificador oficial de visas)', url: 'https://www.iatatravelcentre.com/' },
      { name: 'Sherpa — Requisitos de entrada y visa', url: 'https://apply.joinsherpa.com/travel-restrictions' },
      { name: 'Embajada / Consulado (buscá la de tu país)', url: 'https://www.embassy-worldwide.com/' }
    ];
    var visaLinks = lang === 'en' ? visaLinksEN : visaLinksES;
    var verifyLabel = lang === 'en' ? 'Verify with official sources:' : 'Verificá en fuentes oficiales:';

    h += '<div class="result-section">';
    h += '<h3 class="result-section-title">' + (lang==='en'?'Visa Information':'Información de Visa') + '</h3>';
    h += '<div class="visa-warning">' + (lang === 'en' ? visaWarningEN : visaWarningES) + '</div>';
    if (d.visa) {
      h += '<div class="visa-box visa-ai-content">';
      h += '<p class="visa-ai-label">' + (lang==='en'?'AI summary (verify before acting on this):':'Resumen IA (verificá antes de tomar decisiones):') + '</p>';
      h += esc(d.visa);
      h += '</div>';
    }
    h += '<div class="visa-official">';
    h += '<p class="visa-official-label">' + verifyLabel + '</p>';
    h += '<div class="booking-links-list">';
    visaLinks.forEach(function(lnk) {
      h += '<div class="booking-link-item"><a href="' + esc(lnk.url) + '" target="_blank" rel="noopener">';
      h += '<div class="bli-info"><p class="bli-name">' + esc(lnk.name) + '</p></div>';
      h += '<span class="bli-arrow">↗</span></a></div>';
    });
    h += '</div></div>';
    h += '</div>';

    // Alternatives
    if (d.alternatives && d.alternatives.length) {
      h += '<div class="result-section">';
      h += '<h3 class="result-section-title">' + (lang==='en'?'Alternative Destinations':'Destinos Alternativos') + '</h3>';
      h += '<div class="alternatives-grid">';
      d.alternatives.forEach(function (alt) {
        h += '<div class="alt-card">';
        h += '<p class="alt-dest">' + esc(alt.destination || '') + '</p>';
        h += '<p class="alt-tagline">' + esc(alt.tagline || '') + '</p>';
        h += '<p class="alt-reason">' + esc(alt.reason || '') + '</p>';
        h += '</div>';
      });
      h += '</div></div>';
    }

    return h;
  }

  function renderError(msg) {
    isSubmitting = false;
    el('loading-screen').setAttribute('hidden', '');
    el('slideshow').style.display = '';
    startSlideshowTimer();

    var body = el('quiz-body');
    body.innerHTML = '<div class="question-wrap">' +
      '<div class="error-box">' +
      '<strong>' + (lang==='en'?'Something went wrong':'Algo salió mal') + '</strong>' +
      esc(msg) + '<br><br>' +
      (lang==='en'?'Check your API key in settings and try again.':'Verificá tu clave en el ícono de configuración e intentá de nuevo.') +
      '</div></div>';

    el('btn-continue').disabled = false;
    el('btn-continue').classList.remove('is-loading');
    el('btn-continue').querySelectorAll('[data-en]').forEach(function (n) {
      n.dataset.en = 'Try again'; n.dataset.es = 'Intentar de nuevo';
      n.textContent = lang === 'en' ? 'Try again' : 'Intentar de nuevo';
    });
    el('btn-continue').onclick = function () { submitQuiz(); };
  }

  // ============================================================
  //  DOWNLOAD ITINERARY
  // ============================================================
  function downloadItinerary(data) {
    var dest = (data.destination || 'itinerary').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    var dateStr = new Date().toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var title = 'Weygo — ' + (data.destination || 'Itinerary');

    var css = [
      '*{box-sizing:border-box;margin:0;padding:0}',
      'body{font-family:"DM Sans",system-ui,sans-serif;background:#F7F3EE;color:#1C1917;padding:0}',
      '.doc-header{background:#1C1917;padding:2.5rem 3rem;display:flex;align-items:center;justify-content:space-between}',
      '.doc-logo{font-family:"Cormorant Garamond",Georgia,serif;font-size:1.5rem;font-weight:300;letter-spacing:.22em;text-transform:uppercase;color:#B8975A}',
      '.doc-date{font-size:.75rem;color:rgba(255,255,255,.45);letter-spacing:.08em}',
      '.doc-body{max-width:820px;margin:0 auto;padding:3rem 2rem}',
      '.result-download-bar{display:none}',
      '.result-hero{margin-bottom:2.5rem;padding-bottom:2.5rem;border-bottom:1px solid rgba(28,25,23,.1)}',
      '.result-hero-label{font-size:.7rem;letter-spacing:.15em;text-transform:uppercase;color:#B8975A;margin-bottom:1rem}',
      '.result-destination{font-family:"Cormorant Garamond",Georgia,serif;font-size:2.75rem;font-weight:300;line-height:1.05;color:#1C1917;margin-bottom:.5rem}',
      '.result-tagline-big{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-size:1.2rem;color:#78716C;margin-bottom:1.5rem;line-height:1.4}',
      '.result-justification{font-size:.9rem;color:#44403C;line-height:1.75;max-width:58ch}',
      '.result-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:rgba(28,25,23,.1);border:1px solid rgba(28,25,23,.1);margin-bottom:2.5rem}',
      '.stat-item{background:#fff;padding:1.25rem 1.5rem}',
      '.stat-label{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:#A8A29E;margin-bottom:.4rem}',
      '.stat-value{font-family:"Cormorant Garamond",Georgia,serif;font-size:1rem;color:#44403C}',
      '.result-section{margin-bottom:2.5rem}',
      '.result-section-title{font-family:"Cormorant Garamond",Georgia,serif;font-size:1.35rem;font-weight:400;color:#1C1917;margin-bottom:1.25rem;padding-bottom:.75rem;border-bottom:1px solid rgba(28,25,23,.1)}',
      '.itinerary-days{display:flex;flex-direction:column;gap:.5rem}',
      '.day-item{border:1px solid rgba(28,25,23,.1)}',
      '.day-header{display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;background:#fff}',
      '.day-num{font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:#B8975A;width:40px}',
      '.day-title-text{font-family:"Cormorant Garamond",Georgia,serif;font-size:1rem;color:#1C1917}',
      '.day-chevron{display:none}',
      '.day-body{display:block!important;padding:1rem 1.25rem 1.25rem;background:#F7F3EE;border-top:1px solid rgba(28,25,23,.1)}',
      '.day-slot{margin-bottom:.875rem}',
      '.slot-time{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:#A8A29E;margin-bottom:.25rem}',
      '.slot-activity{font-size:.875rem;color:#44403C;line-height:1.6}',
      '.day-stay{margin-top:.875rem;padding-top:.875rem;border-top:1px solid rgba(28,25,23,.1);font-size:.8rem;color:#78716C}',
      '.day-stay strong{color:#44403C}',
      '.booking-category{margin-bottom:1.75rem}',
      '.booking-cat-title{font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:#78716C;margin-bottom:.75rem;padding-bottom:.5rem;border-bottom:1px solid rgba(28,25,23,.1)}',
      '.booking-links-list{display:flex;flex-direction:column;gap:.5rem}',
      '.booking-link-item{border:1px solid rgba(28,25,23,.1);background:#fff}',
      '.booking-link-item a{display:flex;align-items:center;justify-content:space-between;padding:.875rem 1.125rem;text-decoration:none;color:inherit}',
      '.bli-name{font-size:.875rem;color:#44403C;margin-bottom:.15rem}',
      '.bli-note{font-size:.75rem;color:#A8A29E}',
      '.bli-arrow{color:#2C4A3E;font-size:.8rem}',
      '.tips-list{display:flex;flex-direction:column;gap:1rem}',
      '.tip-item{display:flex;gap:1.25rem;align-items:flex-start}',
      '.tip-num{font-family:"Cormorant Garamond",Georgia,serif;font-size:1.25rem;color:#B8975A;flex-shrink:0;line-height:1.3}',
      '.tip-text{font-size:.875rem;color:#44403C;line-height:1.65}',
      '.visa-box{background:#fff;border:1px solid rgba(28,25,23,.1);padding:1.5rem;font-size:.875rem;color:#44403C;line-height:1.7}',
      '.alternatives-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}',
      '.alt-card{border:1px solid rgba(28,25,23,.1);padding:1.5rem;background:#fff}',
      '.alt-dest{font-family:"Cormorant Garamond",Georgia,serif;font-size:1.2rem;color:#1C1917;margin-bottom:.25rem}',
      '.alt-tagline{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-size:.875rem;color:#B8975A;margin-bottom:.75rem}',
      '.alt-reason{font-size:.8rem;color:#78716C;line-height:1.6}',
      '.doc-footer{text-align:center;padding:2rem;font-size:.7rem;color:#A8A29E;letter-spacing:.08em;border-top:1px solid rgba(28,25,23,.1);margin-top:3rem}'
    ].join('');

    var body = buildResultHTML(data);
    var powered = lang === 'en' ? 'Generated by Weygo · AI Travel Concierge · ' + dateStr : 'Generado por Weygo · Concierge de Viajes con IA · ' + dateStr;

    var html = '<!DOCTYPE html><html lang="' + lang + '"><head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + title + '</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">' +
      '<style>' + css + '</style>' +
      '</head><body>' +
      '<div class="doc-header">' +
        '<div class="doc-logo">Weygo</div>' +
        '<div class="doc-date">' + dateStr + '</div>' +
      '</div>' +
      '<div class="doc-body">' + body + '</div>' +
      '<div class="doc-footer">' + powered + '</div>' +
      '</body></html>';

    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'weygo-' + dest + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  // ============================================================
  //  RESTART
  // ============================================================
  function restartQuiz() {
    answers = {};
    currentIdx = 0;
    currentSlide = 0;
    isSubmitting = false;

    var panel = el('quiz-panel');
    panel.classList.remove('result-mode');

    el('result-panel').setAttribute('hidden', '');
    el('loading-screen').setAttribute('hidden', '');
    el('slideshow').style.display = '';

    // Restore footer
    var footer = el('quiz-footer');
    footer.innerHTML = '<button id="btn-back" class="btn-nav btn-back" disabled>' +
      '<span class="btn-nav-arrow">←</span>' +
      '<span data-en="Back" data-es="' + 'Atrás' + '">' + (lang==='en'?'Back':'Atrás') + '</span>' +
      '</button>' +
      '<button id="btn-continue" class="btn-nav btn-continue">' +
      '<span data-en="Continue" data-es="Continuar">' + (lang==='en'?'Continue':'Continuar') + '</span>' +
      '<span class="btn-nav-arrow">→</span>' +
      '</button>';

    initNav();
    renderQuestion();
    startSlideshowTimer();
  }

  // ============================================================
  //  LANGUAGE TOGGLE
  // ============================================================
  function initLangToggle() {
    el('lang-toggle').addEventListener('click', function () {
      lang = lang === 'en' ? 'es' : 'en';
      updateLangAttr();
      updateSlideCaption(currentSlide);
      updateLandingCaption(currentSlide);
      collectAnswer();
      renderQuestion();
    });
  }

  // ============================================================
  //  ESCAPE HELPER
  // ============================================================
  function esc(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ============================================================
  //  REVEAL safety — defensive CSS backup (A.4.5)
  // ============================================================
  function injectRevealSafety() {
    var style = document.createElement('style');
    style.textContent = '.reveal[data-split]{opacity:1;transform:none;}';
    document.head.appendChild(style);
  }

  // ============================================================
  //  BOOT
  // ============================================================
  function init() {
    safe(injectRevealSafety, 'revealSafety');
    safe(initApiModal,   'apiModal');
    safe(initLanding,    'landing');
    safe(initSlideshow,  'slideshow');
    safe(startSlideshowTimer, 'slideshowTimer');
    safe(initLangToggle, 'langToggle');
    safe(initNav,        'nav');
    safe(renderQuestion, 'renderQuestion');
  }

  document.addEventListener('DOMContentLoaded', init);

})();
