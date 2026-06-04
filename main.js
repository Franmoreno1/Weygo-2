(function () {
  'use strict';

  // ============================================================
  //  STATE
  // ============================================================
  let lang = 'en';
  let currentIdx = 0;
  let answers = {};
  let visibleQuestions = [];
  let slideshowTimer = null;
  let currentSlide = 0;
  let isSubmitting = false;
  let currentItinerary = null;
  let prefilledProfile = false;

  function isDeployed() {
    var h = window.location.hostname;
    return h !== 'localhost' && h !== '127.0.0.1' && window.location.protocol !== 'file:';
  }

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn('[Weygo:' + name + ']', e); }
  }
  function el(id) { return document.getElementById(id); }
  function esc(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // ============================================================
  //  SLIDES DATA
  // ============================================================
  const SLIDES = [
    { bg:'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1920&q=80', place:'Kyoto', country:'Japan', en:'Where ancient silences bloom', es:'Donde los silencios ancestrales florecen' },
    { bg:'https://images.unsplash.com/photo-1533104182551-7dcbc4d0d63e?auto=format&fit=crop&w=1920&q=80', place:'Santorini', country:'Greece', en:'Cerulean dreams above the Aegean', es:'Sueños cerúleos sobre el Egeo' },
    { bg:'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80', place:'Patagonia', country:'Argentina', en:'At the edge of the known world', es:'En el confín del mundo conocido' },
    { bg:'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1920&q=80', place:'Tuscany', country:'Italy', en:'Golden hours among ancient vines', es:'Horas doradas entre viñas ancestrales' },
    { bg:'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=80', place:'Norwegian Fjords', country:'Norway', en:'Where the earth folds into the sea', es:'Donde la tierra se dobla hacia el mar' },
    { bg:'https://images.unsplash.com/photo-1539020140153-e476d581e0fa?auto=format&fit=crop&w=1920&q=80', place:'Marrakech', country:'Morocco', en:'A labyrinth of golden light', es:'Un laberinto de luz dorada' },
    { bg:'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1920&q=80', place:'Ubud', country:'Bali', en:'Serenity terraced above the clouds', es:'Serenidad terrazada sobre las nubes' },
    { bg:'https://images.unsplash.com/photo-1514282401047-065de7e0c79e?auto=format&fit=crop&w=1920&q=80', place:'Maldives', country:'Indian Ocean', en:'Where time dissolves into turquoise', es:'Donde el tiempo se disuelve en turquesa' }
  ];

  // ============================================================
  //  DESTINATIONS DATA (Explore section)
  // ============================================================
  const DESTINATIONS = [
    { id:'kyoto', name:'Kyoto', country:'Japan', region:'asia', types:['culture','nature'], season:'Mar – May · Oct – Nov', budget:'$120 / day', photo:'1528360983277-13d401cdc186' },
    { id:'amalfi', name:'Amalfi Coast', country:'Italy', region:'europe', types:['beach','luxury'], season:'May – Sep', budget:'$180 / day', photo:'1555993539-1732b0258235' },
    { id:'patagonia', name:'Patagonia', country:'Argentina', region:'americas', types:['nature','adventure'], season:'Nov – Feb', budget:'$80 / day', photo:'1501854140801-50d01698950b' },
    { id:'maldives', name:'Maldives', country:'Indian Ocean', region:'asia', types:['beach','luxury'], season:'Dec – Apr', budget:'$300 / day', photo:'1514282401047-065de7e0c79e' },
    { id:'marrakech', name:'Marrakech', country:'Morocco', region:'africa', types:['culture','adventure'], season:'Mar – May', budget:'$60 / day', photo:'1539020140153-e476d581e0fa' },
    { id:'norway', name:'Norwegian Fjords', country:'Norway', region:'europe', types:['nature','adventure'], season:'Jun – Aug', budget:'$150 / day', photo:'1476514525535-07fb3b4ae5f1' },
    { id:'bali', name:'Bali', country:'Indonesia', region:'asia', types:['culture','nature'], season:'Apr – Oct', budget:'$50 / day', photo:'1537996194471-e657df975ab4' },
    { id:'santorini', name:'Santorini', country:'Greece', region:'europe', types:['beach','luxury'], season:'May – Oct', budget:'$160 / day', photo:'1533104182551-7dcbc4d0d63e' },
    { id:'banff', name:'Banff', country:'Canada', region:'americas', types:['nature','adventure'], season:'Jun – Sep', budget:'$130 / day', photo:'1503614472-8c93d56e92ce' },
    { id:'lisbon', name:'Lisbon', country:'Portugal', region:'europe', types:['culture','beach'], season:'Mar – Nov', budget:'$80 / day', photo:'1555881400-74d7acaacd8b' },
    { id:'cape-town', name:'Cape Town', country:'South Africa', region:'africa', types:['nature','adventure'], season:'Nov – Mar', budget:'$90 / day', photo:'1580060839134-75a5edca2e99' },
    { id:'queenstown', name:'Queenstown', country:'New Zealand', region:'oceania', types:['adventure','nature'], season:'Dec – Feb · Jun – Aug', budget:'$120 / day', photo:'1507699622108-4be3abd695ad' }
  ];

  // ============================================================
  //  BLOG ARTICLES DATA
  // ============================================================
  const ARTICLES = [
    {
      id:'solo-travel', cat:'Slow Travel',
      catEs:'Viaje Lento',
      title:'The Art of Travelling Solo: 10 Perfect Destinations',
      titleEs:'El arte de viajar solo: 10 destinos perfectos para el viajero solitario',
      excerpt:'Travelling alone is the ultimate exercise in self-knowledge. These 10 destinations offer safety, community and unforgettable encounters.',
      excerptEs:'Viajar solo es el ejercicio definitivo de autoconocimiento. Estos 10 destinos ofrecen seguridad, comunidad y encuentros inolvidables.',
      photo:'1501854140801-50d01698950b',
      content:`<p>There is a particular kind of freedom that only solo travel offers: the freedom to change course at noon, to linger in a café until closing, to follow a stranger's tip down an unmarked alley. It is the freedom of the self-determined journey.</p>
<h3>1. Lisbon, Portugal</h3>
<p>Few cities welcome the solitary traveller as warmly as Lisbon. The miradouros — viewpoints scattered across the hills — are natural gathering points where strangers become friends over a glass of vinho verde and the sound of fado drifting from a nearby window.</p>
<h3>2. Kyoto, Japan</h3>
<p>Japan's ancient capital rewards the slow, attentive traveller. Wander through bamboo forests at dawn, when the tourist crowds are still asleep, and you'll understand why solitude can feel like the richest company.</p>
<h3>3. Medellín, Colombia</h3>
<p>Once infamous, now one of South America's most vibrant cities. The digital nomad community is thriving, the cost of living is low, and the warmth of the paisa people is legendary.</p>
<p>Each of these destinations offers a different rhythm, a different texture of solitude. The question isn't whether to travel alone — it's where to go first.</p>`,
      contentEs:`<p>Existe una libertad particular que solo el viaje en solitario ofrece: la libertad de cambiar de rumbo al mediodía, de quedarse en un café hasta el cierre, de seguir el consejo de un extraño por un callejón sin nombre.</p>
<h3>1. Lisboa, Portugal</h3>
<p>Pocas ciudades reciben al viajero solitario con tanta calidez como Lisboa. Los miradouros — miradores dispersos por las colinas — son puntos de encuentro naturales donde los extraños se vuelven amigos ante un vinho verde.</p>
<h3>2. Kioto, Japón</h3>
<p>La antigua capital de Japón recompensa al viajero lento y atento. Recorre los bosques de bambú al amanecer, cuando las multitudes turísticas aún duermen.</p>
<p>Cada uno de estos destinos ofrece un ritmo diferente, una textura distinta de soledad. La pregunta no es si viajar solo, sino a dónde ir primero.</p>`
    },
    {
      id:'patagonia-guide', cat:'Adventure',
      catEs:'Aventura',
      title:'The Complete Patagonia Guide: Torres del Paine End to End',
      titleEs:'Guía completa de Patagonia: Torres del Paine de punta a punta',
      excerpt:'8,000 km² of raw wilderness, granite towers and glaciers the colour of jade. Everything you need to know before you go.',
      excerptEs:'8.000 km² de naturaleza pura, torres de granito y glaciares del color del jade. Todo lo que necesitás saber antes de ir.',
      photo:'1501854140801-50d01698950b',
      content:`<p>Patagonia operates on its own clock. Storms arrive without warning; days stretch until ten at night in summer; trails demand respect and preparation. But those who come prepared are rewarded with landscapes that rearrange something fundamental in the way they see the world.</p>
<h3>The W Circuit</h3>
<p>The classic route covers the most iconic viewpoints — the French Valley, the Grey Glacier, the towers themselves — in 4–5 days. Book refugio accommodation months in advance; spaces fill by January regardless of the year.</p>
<h3>The Full O Circuit</h3>
<p>For those with more time and experience, the O Circuit (8–10 days) encircles the entire massif. The northern section is remote, technically demanding, and absolutely magnificent.</p>
<h3>When to Go</h3>
<p>November and February offer the best balance of good weather and fewer visitors. January is peak season — beautiful but crowded. April brings autumn colours and unpredictable weather.</p>`,
      contentEs:`<p>La Patagonia funciona con su propio reloj. Las tormentas llegan sin aviso; los días se extienden hasta las diez de la noche en verano; los senderos exigen respeto y preparación.</p>
<h3>El Circuito W</h3>
<p>La ruta clásica cubre los miradores más icónicos en 4-5 días. Reservá el alojamiento en refugios con meses de anticipación.</p>
<h3>El Circuito O completo</h3>
<p>Para quienes tienen más tiempo y experiencia, el Circuito O (8-10 días) rodea todo el macizo. La sección norte es remota, técnicamente exigente y absolutamente magnífica.</p>
<h3>Cuándo ir</h3>
<p>Noviembre y febrero ofrecen el mejor equilibrio entre buen clima y menos visitantes. Enero es temporada alta — hermoso pero concurrido.</p>`
    },
    {
      id:'kyoto-offseason', cat:'Culture',
      catEs:'Cultura',
      title:'Kyoto Off-Season: How to Avoid the Crowds and Truly Enjoy It',
      titleEs:'Kyoto fuera de temporada: cómo evitar las multitudes y disfrutarlo de verdad',
      excerpt:'Cherry blossom season is beautiful. But the Kyoto regulars know: the real city reveals itself in November and February.',
      excerptEs:'La temporada de sakura es hermosa. Pero los habituales de Kyoto saben: la ciudad real se revela en noviembre y febrero.',
      photo:'1528360983277-13d401cdc186',
      content:`<p>Every year, three million visitors descend on Kyoto during the cherry blossom season. The result is beautiful but increasingly difficult to experience — the famous paths choked with selfie sticks, the temples queued around the block.</p>
<h3>November: The Secret Season</h3>
<p>Autumn foliage in Kyoto is, by any measure, more dramatic than spring. The maples around Tofuku-ji turn shades of crimson that photographs cannot capture. And the crowds, while present, are a fraction of the April peak.</p>
<h3>February: The Honest City</h3>
<p>February is when Kyoto belongs to the locals. The Plum Blossom Festival at Kitano Tenmangu is a quiet, intimate affair. The ryokan prices drop by 40%. The noodle shops don't have queues. This is the city as it actually is.</p>`,
      contentEs:`<p>Cada año, tres millones de visitantes llegan a Kyoto durante la temporada de cerezos. El resultado es hermoso pero cada vez más difícil de disfrutar.</p>
<h3>Noviembre: La temporada secreta</h3>
<p>El follaje otoñal en Kyoto es, por cualquier medida, más dramático que la primavera. Los arces alrededor de Tofuku-ji adquieren tonos carmesí que las fotografías no pueden capturar.</p>
<h3>Febrero: La ciudad honesta</h3>
<p>En febrero, Kyoto pertenece a los locales. Los precios de los ryokanes bajan un 40%. Los restaurantes de fideos no tienen fila. Esta es la ciudad tal como realmente es.</p>`
    },
    {
      id:'surf-indonesia', cat:'Adventure',
      catEs:'Aventura',
      title:'Surfing Indonesia: The Best Spots for Every Level',
      titleEs:'Surf en Indonesia: los mejores spots para cada nivel',
      excerpt:'From Bali beginner breaks to the legendary barrels of Mentawai — the Indonesian archipelago is the world\'s greatest surf destination.',
      excerptEs:'Desde las olas para principiantes de Bali hasta los legendarios barriles de Mentawai — el archipiélago indonesio es el mayor destino de surf del mundo.',
      photo:'1537996194471-e657df975ab4',
      content:`<p>Indonesia has more surf spots than any country on Earth. The combination of the Indian Ocean swell, volcanic reefs, and consistent trade winds creates conditions that have attracted surfers since the 1970s.</p>
<h3>Bali: For Beginners and Intermediates</h3>
<p>Kuta and Seminyak offer long, forgiving beach breaks perfect for learning. Canggu has become the hub of surf culture — the cafés, the boutiques, the sunset sessions at Echo Beach.</p>
<h3>Uluwatu: For Advanced Surfers</h3>
<p>The cave entrance, the long paddle, the left-hand reef break that peels for 200 metres — Uluwatu is one of the most iconic waves in Asia. Best at mid-tide with a south-southwest swell.</p>
<h3>Mentawai: For Experts Only</h3>
<p>The Mentawai Islands off the coast of Sumatra offer some of the most powerful, hollow waves on the planet. Most surfers access them via liveaboard boat. This is not a destination for the faint-hearted.</p>`,
      contentEs:`<p>Indonesia tiene más spots de surf que cualquier otro país del mundo. La combinación del swell del Océano Índico, los arrecifes volcánicos y los vientos alisios crean condiciones únicas.</p>
<h3>Bali: Para principiantes e intermedios</h3>
<p>Kuta y Seminyak ofrecen olas largas y perdonadoras, perfectas para aprender. Canggu se ha convertido en el hub de la cultura surf.</p>
<h3>Uluwatu: Para surfistas avanzados</h3>
<p>La entrada por la cueva, el largo paddling, la ola de izquierda que se peina durante 200 metros — Uluwatu es una de las olas más icónicas de Asia.</p>
<h3>Mentawai: Solo para expertos</h3>
<p>Las Islas Mentawai ofrecen algunas de las olas más poderosas y huecas del planeta. La mayoría de los surfistas acceden en barcos liveaboard.</p>`
    },
    {
      id:'luxury-budget', cat:'Luxury',
      catEs:'Lujo',
      title:'Luxury Feel, Real Price: 5 Destinations Where Your Money Goes Further',
      titleEs:'Presupuesto de lujo con precio real: 5 destinos donde tu plata vale el doble',
      excerpt:'You don\'t need a Ritz budget to live like one. These five destinations offer five-star experiences at three-star prices.',
      excerptEs:'No necesitás un presupuesto del Ritz para vivir como tal. Estos cinco destinos ofrecen experiencias de cinco estrellas a precios de tres.',
      photo:'1533104182551-7dcbc4d0d63e',
      content:`<p>The concept of "luxury" is relative to the exchange rate. In some corners of the world, your holiday budget unlocks a level of service, beauty and exclusivity that would be three times the price back home.</p>
<h3>1. Portugal</h3>
<p>A Michelin-starred dinner in Lisbon costs what a mid-range meal costs in London. A boutique hotel in the Alentejo — with a pool, a vineyard and a chef — runs €120 per night. The wine is included.</p>
<h3>2. Georgia (the country)</h3>
<p>Cave monasteries, the Caucasus mountains, some of the world's oldest wine culture, and almost no tourists. A beautiful guesthouse with breakfast in Tbilisi: €30.</p>
<h3>3. Mexico (beyond Cancún)</h3>
<p>Oaxaca offers a depth of culture, gastronomy and craft that few cities match, at a fraction of European prices. A private mezcal tasting with a third-generation distiller costs less than a glass of wine in Copenhagen.</p>`,
      contentEs:`<p>El concepto de "lujo" es relativo al tipo de cambio. En algunos rincones del mundo, tu presupuesto de vacaciones desbloquea un nivel de servicio, belleza y exclusividad que costaría el triple en casa.</p>
<h3>1. Portugal</h3>
<p>Una cena con estrella Michelin en Lisboa cuesta lo que una comida de nivel medio en Londres. Un hotel boutique en el Alentejo — con piscina, viñedo y chef — tiene un precio de €120 por noche.</p>
<h3>2. Georgia (el país)</h3>
<p>Monasterios en cuevas, las montañas del Cáucaso, una de las culturas vitivinícolas más antiguas del mundo, y casi sin turistas. Una hermosa pensión con desayuno en Tbilisi: €30.</p>
<h3>3. México (más allá de Cancún)</h3>
<p>Oaxaca ofrece una profundidad de cultura, gastronomía y artesanía que pocas ciudades igualan, a una fracción de los precios europeos.</p>`
    },
    {
      id:'alps-ski', cat:'Winter Sports',
      catEs:'Deportes de Invierno',
      title:'Winter Wonderland: The Best Ski Resorts in the Alps',
      titleEs:'Winter Wonderland: las mejores estaciones de ski de los Alpes',
      excerpt:'From the iconic slopes of Verbier to the hidden gems of the Dolomites — a curated guide to the finest skiing in Europe.',
      excerptEs:'Desde las icónicas pistas de Verbier hasta las joyas escondidas de los Dolomitas — una guía curada al mejor ski de Europa.',
      photo:'1476514525535-07fb3b4ae5f1',
      content:`<p>The Alps contain some of the finest skiing terrain on Earth — 29,000 kilometres of marked runs across France, Switzerland, Austria and Italy. But not all ski resorts are equal.</p>
<h3>For the Purist: Verbier, Switzerland</h3>
<p>Off-piste terrain that attracts the world's best freeriders, a vibrant après-ski scene, and access to the Four Valleys — one of the largest ski areas in the world. Verbier is expensive, demanding, and completely addictive.</p>
<h3>For the Romantic: Cortina d'Ampezzo, Italy</h3>
<p>The Dolomites turn pink at sunrise — the phenomenon known as alpenglow. Cortina's ski area is smaller than Verbier's, but the scenery is arguably more beautiful, and the food is certainly better.</p>
<h3>For Families: Avoriaz, France</h3>
<p>A car-free resort with direct access to the Portes du Soleil — 600 km of runs across France and Switzerland. The village architecture is peculiar and charming; the ski school, excellent.</p>`,
      contentEs:`<p>Los Alpes contienen algunos de los mejores terrenos de esquí del mundo — 29.000 kilómetros de pistas marcadas en Francia, Suiza, Austria e Italia.</p>
<h3>Para el purista: Verbier, Suiza</h3>
<p>Terreno fuera de pista que atrae a los mejores freeriders del mundo y acceso al área de Las Cuatro Valles — uno de los dominios esquiables más grandes del mundo.</p>
<h3>Para los románticos: Cortina d'Ampezzo, Italia</h3>
<p>Las Dolomitas se vuelven rosas al amanecer. El dominio esquiable de Cortina es más pequeño que el de Verbier, pero el paisaje es posiblemente más hermoso, y la comida es definitivamente mejor.</p>`
    },
    {
      id:'serengeti', cat:'Safari',
      catEs:'Safari',
      title:'Safari in Tanzania: A Practical Guide to the Serengeti',
      titleEs:'Safari en Tanzania: guía práctica del Serengeti',
      excerpt:'The Great Migration. Big Five. Ngorongoro Crater. Everything you need to plan the safari of a lifetime.',
      excerptEs:'La Gran Migración. Big Five. Cráter del Ngorongoro. Todo lo que necesitás para planear el safari de tu vida.',
      photo:'1580060839134-75a5edca2e99',
      content:`<p>The Serengeti is one of those places that exceeds expectation regardless of how high you set it. Watching a million wildebeest move across a plain at sunrise, with no other humans in sight, is one of the defining experiences of a human life.</p>
<h3>The Great Migration: When to Go</h3>
<p>The migration is year-round, but the famous river crossings happen between July and October at the Mara River in the northern Serengeti. Book camps in this area well in advance — some lodges fill two years ahead.</p>
<h3>Ngorongoro Crater</h3>
<p>A collapsed volcano containing the world's densest population of wildlife per square kilometre. The crater walls form a natural enclosure; animals rarely leave. You are almost guaranteed to see the Big Five in a single day.</p>
<h3>Budget Considerations</h3>
<p>Tanzania is not a budget destination. A quality safari runs USD 400–800 per person per night (all inclusive). Cutting corners on accommodation usually means cutting corners on the game-driving experience.</p>`,
      contentEs:`<p>El Serengeti es uno de esos lugares que supera las expectativas sin importar cuán altas las pongas. Ver a un millón de ñus moverse por una llanura al amanecer es una de las experiencias definitivas de la vida humana.</p>
<h3>La Gran Migración: Cuándo ir</h3>
<p>Los famosos cruces de río ocurren entre julio y octubre en el río Mara, en el norte del Serengeti. Reservá campamentos en esta zona con mucha anticipación.</p>
<h3>Cráter del Ngorongoro</h3>
<p>Un volcán colapsado que contiene la mayor densidad de vida silvestre por kilómetro cuadrado del mundo. Las paredes del cráter forman un recinto natural; podés ver los Big Five en un solo día.</p>`
    },
    {
      id:'amalfi-roadtrip', cat:'Luxury',
      catEs:'Lujo',
      title:'Road Trip Along the Amalfi Coast: Route, Stays and Insider Tips',
      titleEs:'Roadtrip por la Costa Amalfitana: ruta, hospedaje y tips insider',
      excerpt:'130 kilometres of cliffside road, lemon groves, and turquoise sea. Here\'s how to drive it properly.',
      excerptEs:'130 kilómetros de carretera sobre el acantilado, limoneros y mar turquesa. Así es como se recorre bien.',
      photo:'1555993539-1732b0258235',
      content:`<p>The Amalfi Coast road is simultaneously one of the most beautiful and most terrifying driving experiences in Europe. The SS163 hugs the cliff face for 55 kilometres between Sorrento and Salerno, offering panoramas that justify every hairpin bend.</p>
<h3>The Route</h3>
<p>Start in Naples (or Sorrento if you prefer to skip the city). Drive east: Positano, Amalfi, Ravello, Salerno. The western section is more dramatic; the eastern section more peaceful. Two days is a minimum; four is ideal.</p>
<h3>Where to Stay</h3>
<p>Positano for glamour and sunsets. Praiano for quiet and authenticity (and a fraction of the price). Ravello for culture and altitude — the town sits 350m above the sea, with gardens that drop towards it.</p>
<h3>Practical Notes</h3>
<p>Avoid July and August if possible. Drive west-to-east in the morning (sun behind you on the seaward side). Park at the top of each village and walk down. Never drive at night.</p>`,
      contentEs:`<p>La carretera de la Costa Amalfitana es simultáneamente una de las experiencias de conducción más hermosas y aterradoras de Europa. La SS163 abraza la cara del acantilado durante 55 kilómetros.</p>
<h3>La ruta</h3>
<p>Comenzá en Nápoles (o en Sorrento si preferís saltarte la ciudad). Conducí hacia el este: Positano, Amalfi, Ravello, Salerno. Dos días es el mínimo; cuatro es lo ideal.</p>
<h3>Dónde quedarse</h3>
<p>Positano para el glamour y los atardeceres. Praiano para la tranquilidad y la autenticidad. Ravello para la cultura y la altitud — el pueblo se sienta a 350m sobre el mar.</p>`
    },
    {
      id:'maldives-budget', cat:'Beach',
      catEs:'Playa',
      title:'Maldives Without Breaking the Bank: How to Go for Less Than You Think',
      titleEs:'Maldivas sin romper el banco: cómo ir por menos de lo que imaginás',
      excerpt:'The Maldives has a reputation as a billionaire\'s playground. It doesn\'t have to be.',
      excerptEs:'Las Maldivas tienen fama de ser el patio de juegos de los millonarios. No tiene por qué ser así.',
      photo:'1514282401047-065de7e0c79e',
      content:`<p>The Maldives of Instagram — overwater bungalows, private pools, butler service — exists and is as beautiful as advertised. But it is not the only Maldives.</p>
<h3>Guesthouses on Local Islands</h3>
<p>Since 2009, the Maldives has allowed tourism on inhabited islands. This has opened up a completely different way to experience the country — staying with local families, eating traditional Maldivian food, and paying a fraction of the resort price.</p>
<p>Islands like Maafushi, Thulusdhoo and Thoddoo offer clean guesthouses, consistent surf, snorkelling straight off the beach, and a genuine glimpse of Maldivian daily life — all for USD 60–120 per night.</p>
<h3>The Hybrid Approach</h3>
<p>Many experienced travellers spend 5 nights on a local island and 3 nights at a resort. You get the authentic experience and the postcard moment, without paying resort prices for your entire trip.</p>`,
      contentEs:`<p>Las Maldivas que Instagram muestra — bungalows sobre el agua, piscinas privadas, servicio de mayordomo — existen y son tan hermosas como se publicita. Pero no son las únicas Maldivas.</p>
<h3>Pensiones en islas locales</h3>
<p>Desde 2009, las Maldivas permiten el turismo en islas habitadas. Islas como Maafushi, Thulusdhoo y Thoddoo ofrecen pensiones limpias, snorkelling directo desde la playa, y un vistazo genuino a la vida cotidiana maldiva — todo por USD 60-120 por noche.</p>
<h3>El enfoque híbrido</h3>
<p>Muchos viajeros experimentados pasan 5 noches en una isla local y 3 noches en un resort. Obtenés la experiencia auténtica y el momento postal, sin pagar precios de resort durante todo el viaje.</p>`
    },
    {
      id:'lisbon-4days', cat:'Culture',
      catEs:'Cultura',
      title:'Lisbon in 4 Days: The Perfect Itinerary for Europe\'s Finest City',
      titleEs:'Lisboa en 4 días: el itinerario perfecto para la mejor ciudad de Europa',
      excerpt:'Fado, pastéis de nata, miradouros and trams that somehow still run on time. Here\'s how to spend four days in Lisbon properly.',
      excerptEs:'Fado, pastéis de nata, miradouros y tranvías que de alguna manera siguen llegando a tiempo. Así es cómo pasar cuatro días en Lisboa bien.',
      photo:'1555881400-74d7acaacd8b',
      content:`<p>Lisbon is the kind of city that makes you want to move there. It has everything a city should have — history, character, food, light, music, a river — and none of what cities usually ruin themselves with: self-consciousness, expense, or tourist traps (or very few).</p>
<h3>Day 1: Alfama and the Fado</h3>
<p>Spend the morning climbing through Alfama's medieval streets to the São Jorge Castle. Eat a pastel de nata at the original Pastéis de Belém. In the evening, find a small fado house in the Mouraria neighbourhood and let the music rearrange something inside you.</p>
<h3>Day 2: Belém and the River</h3>
<p>The Jerónimos Monastery is one of the most beautiful buildings in Europe — a late Gothic masterpiece that took 100 years to complete. The Torre de Belém, smaller than expected, is best in late afternoon light.</p>
<h3>Day 3: LX Factory and Bairro Alto</h3>
<p>Saturday mornings at the LX Factory market are essential Lisbon. Vintage, food, books, design. Lunch at the Time Out Market. Dinner in Bairro Alto, where every other doorway opens into a restaurant.</p>`,
      contentEs:`<p>Lisboa es el tipo de ciudad que te hace querer mudarte ahí. Tiene todo lo que una ciudad debería tener — historia, carácter, comida, luz, música, un río — y nada de lo que las ciudades suelen arruinarse.</p>
<h3>Día 1: Alfama y el Fado</h3>
<p>Pasá la mañana subiendo por las calles medievales de Alfama hasta el Castillo de São Jorge. Comé un pastel de nata en los originales Pastéis de Belém. Por la noche, encontrá una pequeña casa de fado en el barrio de Mouraria.</p>
<h3>Día 2: Belém y el río</h3>
<p>El Monasterio de los Jerónimos es uno de los edificios más hermosos de Europa — una obra maestra del gótico tardío que tardó 100 años en completarse.</p>
<h3>Día 3: LX Factory y Bairro Alto</h3>
<p>Los sábados por la mañana en el mercado de LX Factory son esenciales. Por la noche, cenar en Bairro Alto, donde cada segunda puerta abre a un restaurante.</p>`
    }
  ];

  // ============================================================
  //  QUESTIONS
  // ============================================================
  const QUESTIONS = [
    { id:'origin', type:'text', en:{q:'Where are you departing from?',hint:'Your city and country of departure.',placeholder:'e.g. Buenos Aires, Argentina'}, es:{q:'¿Desde dónde salís?',hint:'Tu ciudad y país de salida.',placeholder:'ej. Buenos Aires, Argentina'}, required:true },
    { id:'passport', type:'text', en:{q:'What passport do you travel with?',hint:'This helps us check visa requirements.',placeholder:'e.g. Argentine, Spanish, American…'}, es:{q:'¿Con qué pasaporte viajás?',hint:'Esto nos ayuda con requisitos de visa.',placeholder:'ej. Argentino, Español, Americano…'}, required:true },
    { id:'gender', type:'radio', en:{q:'How do you identify?',hint:'Helps us flag safety considerations.'}, es:{q:'¿Cómo te identificás?',hint:'Nos ayuda a considerar la seguridad en ciertos destinos.'}, required:false, options:[{value:'female',en:'Female',es:'Femenino'},{value:'male',en:'Male',es:'Masculino'},{value:'prefer-not',en:'Prefer not to say',es:'Prefiero no decirlo'}] },
    { id:'age', type:'radio', en:{q:'Your age range?'}, es:{q:'¿Tu rango de edad?'}, required:true, options:[{value:'18-25',en:'18 – 25',es:'18 – 25'},{value:'26-35',en:'26 – 35',es:'26 – 35'},{value:'36-45',en:'36 – 45',es:'36 – 45'},{value:'46-55',en:'46 – 55',es:'46 – 55'},{value:'55+',en:'55 +',es:'55 +'}] },
    { id:'companions', type:'checkbox', en:{q:'Who are you traveling with?',hint:'Select all that apply.'}, es:{q:'¿Con quién viajás?',hint:'Podés elegir más de uno.'}, required:true, options:[{value:'solo',en:'Solo',es:'Solo/a'},{value:'couple',en:'As a couple',es:'En pareja'},{value:'family',en:'Family with children',es:'Familia con hijos'},{value:'friends',en:'Group of friends',es:'Grupo de amigos'},{value:'business',en:'Business / colleagues',es:'Trabajo / colegas'}] },
    { id:'tripType', type:'radio', en:{q:'Domestic or international trip?'}, es:{q:'¿Viaje nacional o internacional?'}, required:true, options:[{value:'domestic',en:'Domestic',es:'Nacional'},{value:'international',en:'International',es:'Internacional'},{value:'both',en:'Open to either',es:'Abierto a cualquiera'}] },
    { id:'dates', type:'daterange', en:{q:'When are you thinking of traveling?',hint:'Approximate dates are fine.',labelFrom:'Departure',labelTo:'Return'}, es:{q:'¿Cuándo planeás viajar?',hint:'Fechas aproximadas están bien.',labelFrom:'Salida',labelTo:'Regreso'}, required:false },
    { id:'budget', type:'radio', en:{q:'Budget per person — excluding flights?',hint:'Covers accommodation, food, and experiences.'}, es:{q:'¿Presupuesto por persona, sin vuelos?',hint:'Incluye alojamiento, comida y experiencias.'}, required:true, options:[{value:'economy',en:'Economy — Under $1,000',es:'Económico — Menos de $1.000'},{value:'standard',en:'Standard — $1,000 – $3,000',es:'Estándar — $1.000 – $3.000'},{value:'premium',en:'Premium — $3,000 – $8,000',es:'Premium — $3.000 – $8.000'},{value:'luxury',en:'Luxury — $8,000+',es:'Lujo — $8.000+'}] },
    { id:'duration', type:'slider', en:{q:'How many days?',unit:'days',unitSingular:'day'}, es:{q:'¿Cuántos días?',unit:'días',unitSingular:'día'}, required:true, min:1,max:30,defaultVal:7 },
    { id:'hasDestination', type:'radio', en:{q:'Do you have a destination in mind?',hint:"No idea? We love that. We'll find your perfect match."}, es:{q:'¿Tenés un destino en mente?',hint:'¿Sin idea? Perfecto. Nosotros lo encontramos.'}, required:true, options:[{value:'yes',en:'Yes — I have one in mind',es:'Sí — tengo uno en mente'},{value:'no',en:'Surprise me',es:'Sorprendeme'}] },
    { id:'destination', type:'text', conditional:function(a){return a.hasDestination==='yes';}, en:{q:'Which destination?',hint:'Be as specific or vague as you like.',placeholder:'e.g. Japan, Patagonia, Morocco…'}, es:{q:'¿A qué destino?',hint:'Tan específico o vago como quieras.',placeholder:'ej. Japón, Patagonia, Marruecos…'}, required:true },
    { id:'experiences', type:'checkbox', en:{q:'What kind of experiences are you seeking?',hint:'Select all that call to you.'}, es:{q:'¿Qué tipo de experiencias buscás?',hint:'Elegí todas las que te llamen.'}, required:true, options:[{value:'beach',en:'Beach & Sun',es:'Playa & Sol',icon:'○'},{value:'nature',en:'Nature & Wildlife',es:'Naturaleza & Fauna',icon:'◇'},{value:'culture',en:'Culture & History',es:'Cultura & Historia',icon:'△'},{value:'gastronomy',en:'Gastronomy',es:'Gastronomía',icon:'◈'},{value:'winter',en:'Winter Sports',es:'Deportes de Invierno',icon:'❄'},{value:'surf',en:'Surf & Water Sports',es:'Surf & Deportes Acuáticos',icon:'〜'},{value:'wellness',en:'Wellness & Spa',es:'Wellness & Spa',icon:'◻'},{value:'urban',en:'Urban Exploration',es:'Exploración Urbana',icon:'⊞'},{value:'safari',en:'Safari & Wildlife',es:'Safari & Fauna Salvaje',icon:'⊕'},{value:'adventure',en:'Adventure Sports',es:'Deportes de Aventura',icon:'▲'},{value:'festivals',en:'Festivals & Events',es:'Festivales & Eventos',icon:'◆'},{value:'luxury',en:'Pure Luxury',es:'Lujo Puro',icon:'✦'}] },
    { id:'sport', type:'select', conditional:function(a){return Array.isArray(a.experiences)&&(a.experiences.includes('winter')||a.experiences.includes('surf')||a.experiences.includes('adventure'));}, en:{q:'Which sport specifically?',hint:"We'll find the best spots for your level.",placeholder:'Select a sport…'}, es:{q:'¿Qué deporte en particular?',hint:'Encontramos los mejores spots para tu nivel.',placeholder:'Elegí un deporte…'}, required:false, options:[{value:'surf',en:'Surfing',es:'Surf'},{value:'diving',en:'Scuba Diving',es:'Buceo'},{value:'kitesurf',en:'Kitesurfing',es:'Kitesurf'},{value:'ski',en:'Alpine Skiing',es:'Ski Alpino'},{value:'snowboard',en:'Snowboarding',es:'Snowboard'},{value:'trekking',en:'Trekking',es:'Trekking'},{value:'climbing',en:'Rock Climbing',es:'Escalada'},{value:'mtb',en:'Mountain Biking',es:'MTB'},{value:'paragliding',en:'Paragliding',es:'Parapente'},{value:'kayak',en:'Kayaking',es:'Kayak'}] },
    { id:'skillLevel', type:'radio', conditional:function(a){return !!a.sport;}, en:{q:"Your skill level in this sport?"}, es:{q:'¿Tu nivel en ese deporte?'}, required:true, options:[{value:'beginner',en:'Beginner — First time or nearly',es:'Principiante — Primera vez o casi'},{value:'intermediate',en:'Intermediate — Some experience',es:'Intermedio — Algo de experiencia'},{value:'advanced',en:'Advanced — Confident & competent',es:'Avanzado — Seguro/a y competente'},{value:'expert',en:'Expert — Professional level',es:'Experto/a — Nivel profesional'}] },
    { id:'visited', type:'checkbox', en:{q:"Regions you've already explored?",hint:"We'll steer you somewhere new. Skip if you're open."}, es:{q:'¿Regiones que ya conociste?',hint:'Te llevamos a algo nuevo. Omití si estás abierto.'}, required:false, options:[{value:'europe',en:'Europe',es:'Europa'},{value:'north-america',en:'North America',es:'Norteamérica'},{value:'south-america',en:'South America',es:'Sudamérica'},{value:'asia',en:'Asia',es:'Asia'},{value:'africa',en:'Africa',es:'África'},{value:'middle-east',en:'Middle East',es:'Medio Oriente'},{value:'oceania',en:'Oceania',es:'Oceanía'},{value:'caribbean',en:'Caribbean',es:'Caribe'}] },
    { id:'avoid', type:'checkbox', en:{q:"Anything you'd rather avoid?",hint:"Skip if everything's on the table."}, es:{q:'¿Algo que preferís evitar?',hint:'Omití si todo está sobre la mesa.'}, required:false, options:[{value:'crowds',en:'Crowds & tourist traps',es:'Multitudes y lugares turísticos'},{value:'long-flights',en:'Very long flights (12h+)',es:'Vuelos muy largos (12h+)'},{value:'heat',en:'Extreme heat',es:'Calor extremo'},{value:'cold',en:'Cold weather',es:'Clima frío'},{value:'beach',en:'Beach & sun',es:'Playa y sol'},{value:'cities',en:'Big cities',es:'Grandes ciudades'},{value:'adventure',en:'Physical challenges',es:'Desafíos físicos'},{value:'party',en:'Party scene / nightlife',es:'Fiesta / vida nocturna'}] },
    { id:'accommodation', type:'checkbox', en:{q:'Preferred accommodation style?',hint:'Select all that work for you.'}, es:{q:'¿Qué estilo de alojamiento preferís?',hint:'Elegí todas las que te funcionan.'}, required:true, options:[{value:'hotel',en:'Hotel',es:'Hotel'},{value:'boutique',en:'Boutique Hotel',es:'Hotel Boutique'},{value:'hostel',en:'Hostel — social',es:'Hostel — social'},{value:'apartment',en:'Apartment / Airbnb',es:'Departamento / Airbnb'},{value:'resort',en:'Resort',es:'Resort'},{value:'glamping',en:'Glamping / Eco lodge',es:'Glamping / Eco lodge'},{value:'cruise',en:'Cruise',es:'Crucero'}] },
    { id:'travelStyle', type:'checkbox', en:{q:'How do you like to travel?',hint:'Choose all that resonate.'}, es:{q:'¿Cómo te gusta viajar?',hint:'Elegí todas las que te representen.'}, required:false, options:[{value:'slow',en:'Slow travel',es:'Viaje lento'},{value:'packed',en:'Packed itinerary',es:'Itinerario completo'},{value:'spontaneous',en:'Spontaneous',es:'Espontáneo'},{value:'planned',en:'Well planned',es:'Bien planificado'},{value:'eco',en:'Eco-conscious',es:'Eco-consciente'},{value:'local',en:'Local immersion',es:'Inmersión local'},{value:'luxury',en:'Luxury',es:'Lujo'},{value:'value',en:'Value-focused',es:'Enfocado en valor'}] },
    { id:'notes', type:'textarea', en:{q:'Anything else your concierge should know?',hint:'Dietary needs, mobility, anniversaries, dream wishes — entirely optional.',placeholder:'Write anything that matters to you…'}, es:{q:'¿Algo más que tu concierge deba saber?',hint:'Restricciones alimentarias, movilidad, aniversarios, deseos especiales — totalmente opcional.',placeholder:'Escribí lo que importa para vos…'}, required:false }
  ];

  // ============================================================
  //  API KEY
  // ============================================================
  function getApiKey() { return localStorage.getItem('weygo_api_key') || ''; }
  function setApiKey(key) { localStorage.setItem('weygo_api_key', key); }

  function initApiModal() {
    var modal = el('api-modal');
    var saveBtn = el('api-key-save');
    var input = el('api-key-input');
    if (isDeployed()) {
      modal.setAttribute('hidden','');
      var sb = el('settings-btn'); if(sb) sb.style.display='none';
      var qs = el('quiz-settings-btn'); if(qs) qs.style.display='none';
      return;
    }
    if (!getApiKey()) modal.removeAttribute('hidden');
    saveBtn.addEventListener('click', function() {
      var key = input.value.trim();
      if (!key || !key.startsWith('sk-')) { input.style.borderColor='var(--danger)'; return; }
      setApiKey(key); modal.setAttribute('hidden','');
    });
    input.addEventListener('keydown', function(e){ if(e.key==='Enter') saveBtn.click(); });
    input.addEventListener('input', function(){ input.style.borderColor=''; });
    var settingsBtn = el('settings-btn');
    if (settingsBtn) settingsBtn.addEventListener('click', function(){ input.value=getApiKey(); modal.removeAttribute('hidden'); });
    var quizSettingsBtn = el('quiz-settings-btn');
    if (quizSettingsBtn) quizSettingsBtn.addEventListener('click', function(){ input.value=getApiKey(); modal.removeAttribute('hidden'); });
  }

  // ============================================================
  //  LANGUAGE
  // ============================================================
  function updateLangAttr() {
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
    document.querySelectorAll('[data-en]').forEach(function(node) {
      node.innerHTML = lang==='en' ? node.dataset.en : (node.dataset.es || node.dataset.en);
    });
    var lt = el('lang-toggle'); if(lt) lt.textContent = lang==='en'?'ES':'EN';
    var hl = el('header-lang'); if(hl) hl.textContent = lang==='en'?'ES':'EN';
  }

  function initLangToggles() {
    function toggleLang() {
      lang = lang==='en'?'es':'en';
      updateLangAttr();
      updateHeroCaption(currentSlide);
      updateSlideshowCaption(currentSlide);
      if (visibleQuestions.length) { collectAnswer(); renderQuestion(); }
    }
    var lt = el('lang-toggle'); if(lt) lt.addEventListener('click', toggleLang);
    var hl = el('header-lang'); if(hl) hl.addEventListener('click', toggleLang);
  }

  // ============================================================
  //  SLIDESHOW (hero + quiz)
  // ============================================================
  function initSlideshow() {
    // Hero slides
    var hContainer = el('hero-slides');
    // Quiz slides
    var qContainer = el('slides-container');
    var dotsEl = el('slide-dots');

    SLIDES.forEach(function(s, i) {
      if (hContainer) {
        var hs = document.createElement('div');
        hs.className = 'hero-slide' + (i===0?' is-active':'');
        hs.style.backgroundImage = 'url('+s.bg+')';
        hContainer.appendChild(hs);
      }
      if (qContainer) {
        var qs = document.createElement('div');
        qs.className = 'slide' + (i===0?' is-active':'');
        qs.style.backgroundImage = 'url('+s.bg+')';
        qContainer.appendChild(qs);
      }
      if (dotsEl) {
        var dot = document.createElement('button');
        dot.className = 'slide-dot' + (i===0?' is-active':'');
        dot.setAttribute('aria-label','Slide '+(i+1));
        dot.addEventListener('click', function(){ goToSlide(i); });
        dotsEl.appendChild(dot);
      }
    });
    updateHeroCaption(0);
    updateSlideshowCaption(0);
    startSlideshowTimer();
  }

  function goToSlide(idx) {
    var hSlides = el('hero-slides') ? el('hero-slides').querySelectorAll('.hero-slide') : [];
    var qSlides = el('slides-container') ? el('slides-container').querySelectorAll('.slide') : [];
    var dots = el('slide-dots') ? el('slide-dots').querySelectorAll('.slide-dot') : [];
    if (hSlides[currentSlide]) hSlides[currentSlide].classList.remove('is-active');
    if (qSlides[currentSlide]) qSlides[currentSlide].classList.remove('is-active');
    if (dots[currentSlide]) dots[currentSlide].classList.remove('is-active');
    currentSlide = (idx + SLIDES.length) % SLIDES.length;
    if (hSlides[currentSlide]) hSlides[currentSlide].classList.add('is-active');
    if (qSlides[currentSlide]) qSlides[currentSlide].classList.add('is-active');
    if (dots[currentSlide]) dots[currentSlide].classList.add('is-active');
    updateHeroCaption(currentSlide);
    updateSlideshowCaption(currentSlide);
  }

  function updateHeroCaption(idx) {
    var s = SLIDES[idx];
    var p=el('hc-place'), c=el('hc-country'), t=el('hc-tagline');
    if(p) p.textContent = s.place;
    if(c) c.textContent = s.country;
    if(t) t.textContent = lang==='en' ? s.en : (s.es||s.en);
  }
  function updateSlideshowCaption(idx) {
    var s = SLIDES[idx];
    var p=el('slide-place'), c=el('slide-country'), t=el('slide-tagline');
    if(p) p.textContent = s.place;
    if(c) c.textContent = s.country;
    if(t) t.textContent = lang==='en' ? s.en : (s.es||s.en);
  }
  function startSlideshowTimer() {
    clearInterval(slideshowTimer);
    slideshowTimer = setInterval(function(){ goToSlide(currentSlide+1); }, 5000);
  }
  function stopSlideshow() { clearInterval(slideshowTimer); }

  // ============================================================
  //  QUIZ OVERLAY
  // ============================================================
  function openQuiz(presetDestination) {
    if (presetDestination) {
      answers.hasDestination = 'yes';
      answers.destination = presetDestination;
    }
    if (!isDeployed() && !getApiKey()) {
      el('api-modal').removeAttribute('hidden');
      el('api-key-save').addEventListener('click', function onSave(){
        if (getApiKey()) { el('api-key-save').removeEventListener('click',onSave); showQuizOverlay(); }
      }, {once:true});
      return;
    }
    showQuizOverlay();
  }

  function showQuizOverlay() {
    var overlay = el('quiz-overlay');
    if (!overlay) return;
    overlay.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    renderQuestion();
    stopSlideshow();
    setTimeout(startSlideshowTimer, 100);
  }

  function closeQuiz() {
    var overlay = el('quiz-overlay');
    if (overlay) overlay.setAttribute('hidden','');
    document.body.style.overflow = '';
    startSlideshowTimer();
  }

  function initQuizOverlay() {
    // CTA buttons on site
    var heroPlanBtn = el('hero-plan-btn');
    if (heroPlanBtn) heroPlanBtn.addEventListener('click', function(){ openQuiz(); });
    var headerPlanBtn = el('header-plan-btn');
    if (headerPlanBtn) headerPlanBtn.addEventListener('click', function(){ openQuiz(); });
    var sfPlanBtn = el('sf-plan-btn');
    if (sfPlanBtn) sfPlanBtn.addEventListener('click', function(e){ e.preventDefault(); openQuiz(); });
    // Close button
    var closeBtn = el('quiz-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeQuiz);
  }

  // ============================================================
  //  EXPLORE DESTINATIONS
  // ============================================================
  function initExplore() {
    var grid = el('dest-grid');
    if (!grid) return;

    // Render cards
    DESTINATIONS.forEach(function(d) {
      var card = document.createElement('div');
      card.className = 'dest-card';
      card.dataset.region = d.region;
      card.dataset.types = d.types.join(',');

      var catEN = d.types.map(function(t){ return t.charAt(0).toUpperCase()+t.slice(1); }).join(' · ');
      var catES = d.types.map(function(t){
        var m={beach:'Playa',nature:'Naturaleza',culture:'Cultura',adventure:'Aventura',luxury:'Lujo',wellness:'Wellness'};
        return m[t]||(t.charAt(0).toUpperCase()+t.slice(1));
      }).join(' · ');

      card.innerHTML = '<div class="dc-img-wrap"><img class="dc-img" src="https://images.unsplash.com/photo-'+d.photo+'?auto=format&fit=crop&w=600&q=70" alt="'+esc(d.name)+'" loading="lazy"></div>' +
        '<div class="dc-body">' +
        '<p class="dc-name">'+esc(d.name)+'</p>' +
        '<p class="dc-country">'+esc(d.country)+'</p>' +
        '<div class="dc-meta">' +
          '<div class="dc-meta-item"><span class="dc-meta-label" data-en="Type" data-es="Tipo">Type</span><span class="dc-meta-val" data-en="'+catEN+'" data-es="'+catES+'">'+catEN+'</span></div>' +
          '<div class="dc-meta-item"><span class="dc-meta-label" data-en="Best season" data-es="Mejor época">Best season</span><span class="dc-meta-val">'+esc(d.season)+'</span></div>' +
          '<div class="dc-meta-item"><span class="dc-meta-label" data-en="Est. budget" data-es="Presupuesto est.">Est. budget</span><span class="dc-meta-val">'+esc(d.budget)+'</span></div>' +
        '</div>' +
        '<button class="dc-plan-btn" data-dest="'+esc(d.name)+'" data-en="Plan this trip →" data-es="Planear este viaje →">Plan this trip →</button>' +
        '</div>';

      grid.appendChild(card);

      card.querySelector('.dc-plan-btn').addEventListener('click', function() {
        openQuiz(d.name);
      });
    });

    // Filter logic
    var filterBtns = el('explore-filters').querySelectorAll('.ef-btn');
    var activeFilter = 'all';
    filterBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        filterBtns.forEach(function(b){ b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        activeFilter = btn.dataset.filter;
        grid.querySelectorAll('.dest-card').forEach(function(card) {
          var show = activeFilter==='all' ||
            card.dataset.region===activeFilter ||
            card.dataset.types.includes(activeFilter);
          card.toggleAttribute('data-hidden', !show);
        });
        // Update filter button text
        updateLangAttr();
      });
    });
  }

  // ============================================================
  //  BLOG / GUIDES
  // ============================================================
  function initBlog() {
    var grid = el('blog-grid');
    if (!grid) return;

    var modal = document.createElement('div');
    modal.id = 'article-modal';
    modal.className = 'article-modal';
    modal.setAttribute('hidden','');
    modal.innerHTML = '<div class="am-header"><div class="am-logo">Weygo</div><button class="am-close" id="am-close">✕</button></div><div class="am-body" id="am-body"></div>';
    document.body.appendChild(modal);

    modal.querySelector('#am-close').addEventListener('click', function(){ modal.setAttribute('hidden',''); document.body.style.overflow=''; });

    ARTICLES.forEach(function(a) {
      var card = document.createElement('div');
      card.className = 'blog-card';
      var catLabel = lang==='en' ? a.cat : a.catEs;
      var titleLabel = lang==='en' ? a.title : a.titleEs;
      var excerptLabel = lang==='en' ? a.excerpt : a.excerptEs;
      var readLabel = lang==='en' ? 'Read guide →' : 'Leer guía →';
      card.innerHTML =
        '<div class="bc-img-wrap"><img class="bc-img" src="https://images.unsplash.com/photo-'+a.photo+'?auto=format&fit=crop&w=600&q=70" alt="'+esc(a.title)+'" loading="lazy"></div>' +
        '<div class="bc-body">' +
          '<p class="bc-cat" data-en="'+esc(a.cat)+'" data-es="'+esc(a.catEs)+'">'+esc(catLabel)+'</p>' +
          '<h3 class="bc-title" data-en="'+esc(a.title)+'" data-es="'+esc(a.titleEs)+'">'+esc(titleLabel)+'</h3>' +
          '<p class="bc-excerpt" data-en="'+esc(a.excerpt)+'" data-es="'+esc(a.excerptEs)+'">'+esc(excerptLabel)+'</p>' +
          '<button class="bc-read-btn" data-en="Read guide →" data-es="Leer guía →">'+esc(readLabel)+'</button>' +
        '</div>';

      card.querySelector('.bc-read-btn').addEventListener('click', function() {
        var isEs = lang==='es';
        var title = isEs ? a.titleEs : a.title;
        var cat = isEs ? a.catEs : a.cat;
        var content = isEs ? a.contentEs : a.content;
        var planLabel = isEs ? 'Dejar que Weygo planifique este viaje →' : 'Let Weygo plan this trip →';
        var planSubLabel = isEs ? 'Abrimos el quiz con este destino pre-seleccionado.' : 'We\'ll open the quiz with this destination pre-selected.';

        el('am-body').innerHTML =
          '<p class="am-kicker">'+esc(cat)+'</p>' +
          '<h1 class="am-title">'+esc(title)+'</h1>' +
          '<img class="am-img" src="https://images.unsplash.com/photo-'+a.photo+'?auto=format&fit=crop&w=900&q=80" alt="'+esc(title)+'" />' +
          '<div class="am-content">'+content+'</div>' +
          '<div class="am-cta-section">' +
            '<p class="am-cta-label">'+esc(planSubLabel)+'</p>' +
            '<button class="am-cta-btn" id="am-plan-btn">'+esc(planLabel)+'</button>' +
          '</div>';

        modal.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
        modal.scrollTop = 0;

        el('am-plan-btn').addEventListener('click', function() {
          modal.setAttribute('hidden','');
          document.body.style.overflow = '';
          openQuiz();
        });
      });

      grid.appendChild(card);
    });
  }

  // ============================================================
  //  QUESTIONS ENGINE
  // ============================================================
  function computeVisible() {
    visibleQuestions = QUESTIONS.filter(function(q) {
      return typeof q.conditional === 'function' ? q.conditional(answers) : true;
    });
  }

  function t(q, field) { return (q[lang]&&q[lang][field]) || (q['en']&&q['en'][field]) || ''; }

  function renderQuestion() {
    computeVisible();
    var q = visibleQuestions[currentIdx];
    if (!q) return;
    var body = el('quiz-body');
    if (!body) return;
    var total = visibleQuestions.length;
    var num = currentIdx + 1;

    var pf = el('progress-fill'); if(pf) pf.style.width = Math.round((num/total)*100)+'%';
    var pt = el('progress-text'); if(pt) { pt.textContent = (lang==='en'?'Question ':'Pregunta ')+num; }
    var pfr = el('progress-fraction'); if(pfr) pfr.textContent = num+' / '+total;

    var qHint = t(q,'hint');
    var html = '<div class="question-wrap">';
    if (prefilledProfile && currentIdx === 0) {
      var bannerMsg = lang==='en' ? '✓ We used your previous profile. You can change any answer below.' : '✓ Usamos tu perfil anterior. Podés cambiar cualquier respuesta abajo.';
      html += '<div class="profile-banner">'+bannerMsg+'</div>';
    }
    html += '<p class="question-number">'+(lang==='en'?'Question':'Pregunta')+' '+num+'</p>';
    html += '<h2 class="question-text">'+esc(t(q,'q'))+'</h2>';
    if (qHint) html += '<p class="question-hint">'+esc(qHint)+'</p>';

    switch(q.type) {
      case 'radio':    html += renderRadio(q); break;
      case 'checkbox': html += renderCheckbox(q); break;
      case 'slider':   html += renderSlider(q); break;
      case 'text':     html += renderText(q); break;
      case 'select':   html += renderSelect(q); break;
      case 'daterange':html += renderDaterange(q); break;
      case 'textarea': html += renderTextarea(q); break;
    }
    html += '<p class="field-error" id="field-error">'+(lang==='en'?'Please answer this question to continue.':'Por favor respondé esta pregunta para continuar.')+'</p>';
    html += '</div>';
    body.innerHTML = html;
    body.scrollTop = 0;
    if (q.type==='slider') wireSlider(q);
    wireCheckboxes(q);
  }

  function renderRadio(q) {
    var html='<div class="options-list">';
    q.options.forEach(function(opt) {
      var checked = answers[q.id]===opt.value?'checked':'';
      var label = lang==='en'?opt.en:(opt.es||opt.en);
      html+='<div class="option-item"><input type="radio" name="'+q.id+'" id="opt-'+opt.value+'" value="'+esc(opt.value)+'" '+checked+'><label class="option-label" for="opt-'+opt.value+'"><span class="option-indicator"></span><span class="option-text">'+esc(label)+'</span></label></div>';
    });
    return html+'</div>';
  }
  function renderCheckbox(q) {
    var html='<div class="options-list">';
    var saved = answers[q.id]||[];
    q.options.forEach(function(opt) {
      var checked=saved.includes(opt.value)?'checked':'';
      var label=lang==='en'?opt.en:(opt.es||opt.en);
      html+='<div class="option-item"><input type="checkbox" name="'+q.id+'" id="opt-'+opt.value+'" value="'+esc(opt.value)+'" '+checked+'><label class="option-label" for="opt-'+opt.value+'"><span class="option-indicator"></span>'+(opt.icon?'<span class="option-icon">'+opt.icon+'</span>':'')+'<span class="option-text">'+esc(label)+'</span></label></div>';
    });
    return html+'</div>';
  }
  function renderSlider(q) {
    var val = answers[q.id]!==undefined?answers[q.id]:q.defaultVal;
    var unit = lang==='en'?(val===1?q.en.unitSingular:q.en.unit):(val===1?q.es.unitSingular:q.es.unit);
    return '<div class="slider-wrap"><div class="slider-value-display" id="slider-display">'+val+'</div><div class="slider-unit" id="slider-unit">'+esc(unit)+'</div><input type="range" id="slider-input" min="'+q.min+'" max="'+q.max+'" value="'+val+'"><div class="slider-labels"><span>'+q.min+'</span><span>'+q.max+'</span></div></div>';
  }
  function renderText(q) {
    var val = answers[q.id]||'';
    return '<div class="text-input-wrap"><input type="text" id="text-input" placeholder="'+esc(t(q,'placeholder'))+'" value="'+esc(val)+'" autocomplete="off"></div>';
  }
  function renderSelect(q) {
    var val=answers[q.id]||'';
    var html='<div class="select-wrap"><select id="select-input"><option value="">'+esc(t(q,'placeholder'))+'</option>';
    q.options.forEach(function(opt){
      var label=lang==='en'?opt.en:(opt.es||opt.en);
      html+='<option value="'+esc(opt.value)+'"'+(val===opt.value?' selected':'')+'>'+esc(label)+'</option>';
    });
    return html+'</select></div>';
  }
  function renderDaterange(q) {
    var f=answers[q.id+'_from']||'', t2=answers[q.id+'_to']||'';
    var lf=lang==='en'?q.en.labelFrom:q.es.labelFrom, lt=lang==='en'?q.en.labelTo:q.es.labelTo;
    return '<div class="daterange-wrap"><div class="date-field"><label>'+esc(lf)+'</label><input type="date" id="date-from" value="'+esc(f)+'"></div><div class="date-field"><label>'+esc(lt)+'</label><input type="date" id="date-to" value="'+esc(t2)+'"></div></div>';
  }
  function renderTextarea(q) {
    var val=answers[q.id]||'';
    return '<div class="text-input-wrap"><textarea id="textarea-input" placeholder="'+esc(t(q,'placeholder'))+'">'+esc(val)+'</textarea></div>';
  }

  function wireSlider(q) {
    var inp=el('slider-input'), disp=el('slider-display'), unitEl=el('slider-unit');
    if(!inp) return;
    function update(){ var v=parseInt(inp.value,10); disp.textContent=v; var unit=lang==='en'?(v===1?q.en.unitSingular:q.en.unit):(v===1?q.es.unitSingular:q.es.unit); unitEl.textContent=unit; answers[q.id]=v; }
    inp.addEventListener('input', update); update();
  }
  function wireCheckboxes(q) {
    if(q.type!=='checkbox') return;
    var body=el('quiz-body'); if(!body) return;
    body.querySelectorAll('input[type="checkbox"]').forEach(function(cb){
      cb.addEventListener('change', function(){
        answers[q.id]=Array.from(body.querySelectorAll('input[type="checkbox"]:checked')).map(function(c){return c.value;});
      });
    });
  }

  function collectAnswer() {
    var q=visibleQuestions[currentIdx]; if(!q) return;
    switch(q.type) {
      case 'radio': { var s=el('quiz-body')&&el('quiz-body').querySelector('input[type="radio"]:checked'); if(s) answers[q.id]=s.value; break; }
      case 'checkbox': { var body=el('quiz-body'); if(body) answers[q.id]=Array.from(body.querySelectorAll('input[type="checkbox"]:checked')).map(function(c){return c.value;}); break; }
      case 'slider': { var inp=el('slider-input'); if(inp) answers[q.id]=parseInt(inp.value,10); break; }
      case 'text': { var inp2=el('text-input'); if(inp2) answers[q.id]=inp2.value.trim(); break; }
      case 'select': { var sel=el('select-input'); if(sel) answers[q.id]=sel.value; break; }
      case 'daterange': { var df=el('date-from'),dt=el('date-to'); if(df) answers[q.id+'_from']=df.value; if(dt) answers[q.id+'_to']=dt.value; break; }
      case 'textarea': { var ta=el('textarea-input'); if(ta) answers[q.id]=ta.value.trim(); break; }
    }
  }
  function validate() {
    var q=visibleQuestions[currentIdx]; if(!q||!q.required) return true;
    var a=answers[q.id];
    if(q.type==='checkbox'){ if(!a||a.length===0){ showFieldError(); return false; } }
    else if(q.type==='radio'||q.type==='select'){ if(!a){ showFieldError(); return false; } }
    else if(q.type==='text'){ if(!a||a===''){ showFieldError(); return false; } }
    else if(q.type==='slider'){ if(a===undefined||a===null){ showFieldError(); return false; } }
    return true;
  }
  function showFieldError() {
    var err=el('field-error'); if(err){ err.textContent=lang==='en'?'Please answer this question to continue.':'Por favor respondé esta pregunta para continuar.'; err.classList.add('visible'); }
  }

  // ============================================================
  //  NAVIGATION
  // ============================================================
  function initNav() {
    var btnCont = el('btn-continue');
    var btnBack = el('btn-back');
    if (!btnCont || !btnBack) return;

    btnCont.addEventListener('click', function() {
      var currentId = visibleQuestions[currentIdx] ? visibleQuestions[currentIdx].id : null;
      collectAnswer();
      if (!validate()) return;
      computeVisible();
      var newIdx = currentId ? visibleQuestions.findIndex(function(q){ return q.id===currentId; }) : currentIdx;
      if (newIdx<0) newIdx=currentIdx;
      if (newIdx>=visibleQuestions.length-1) { submitQuiz(); }
      else { currentIdx=newIdx+1; btnBack.disabled=false; renderQuestion(); }
    });

    btnBack.addEventListener('click', function() {
      var currentId = visibleQuestions[currentIdx] ? visibleQuestions[currentIdx].id : null;
      collectAnswer(); computeVisible();
      var newIdx = currentId ? visibleQuestions.findIndex(function(q){ return q.id===currentId; }) : currentIdx;
      if (newIdx<0) newIdx=currentIdx;
      if (newIdx>0) { currentIdx=newIdx-1; renderQuestion(); btnBack.disabled=currentIdx===0; }
    });

    el('quiz-body').addEventListener('keydown', function(e){
      if(e.key==='Enter'&&e.target.tagName==='INPUT') btnCont.click();
    });
  }

  // ============================================================
  //  SUBMIT → AI
  // ============================================================
  function submitQuiz() {
    if (isSubmitting) return;
    var apiKey = getApiKey();
    if (!isDeployed() && !apiKey) { el('api-modal').removeAttribute('hidden'); return; }
    isSubmitting = true;
    stopSlideshow();
    var s=el('slideshow'); if(s) s.style.display='none';
    var ls=el('loading-screen'); if(ls) ls.removeAttribute('hidden');
    var bc=el('btn-continue'); if(bc){ bc.disabled=true; bc.classList.add('is-loading'); bc.onclick=null; }
    callClaude(apiKey, buildPrompt());
  }

  function buildPrompt() {
    var a=answers, lines=['TRAVELER PROFILE:'];
    lines.push('- Departure city: '+(a.origin||'not specified'));
    lines.push('- Passport/nationality: '+(a.passport||'not specified'));
    lines.push('- Gender: '+(a.gender||'not specified'));
    lines.push('- Age range: '+(a.age||'not specified'));
    lines.push('- Travel companions: '+(Array.isArray(a.companions)?a.companions.join(', '):(a.companions||'not specified')));
    lines.push('- Trip type: '+(a.tripType||'not specified'));
    lines.push('- Departure date: '+(a.dates_from||'flexible'));
    lines.push('- Return date: '+(a.dates_to||'flexible'));
    lines.push('- Budget per person (excl. flights): '+(a.budget||'not specified'));
    lines.push('- Duration: '+(a.duration?a.duration+' days':'not specified'));
    lines.push('- Has destination in mind: '+(a.hasDestination||'no'));
    if(a.destination) lines.push('- Preferred destination: '+a.destination);
    lines.push('- Experiences sought: '+(Array.isArray(a.experiences)?a.experiences.join(', '):'not specified'));
    if(a.sport) lines.push('- Specific sport: '+a.sport);
    if(a.skillLevel) lines.push('- Skill level: '+a.skillLevel);
    if(a.visited&&a.visited.length) lines.push('- Already visited regions: '+a.visited.join(', '));
    if(a.avoid&&a.avoid.length) lines.push('- Wants to avoid: '+a.avoid.join(', '));
    lines.push('- Accommodation preference: '+(Array.isArray(a.accommodation)?a.accommodation.join(', '):(a.accommodation||'not specified')));
    lines.push('- Travel style: '+(Array.isArray(a.travelStyle)?a.travelStyle.join(', '):(a.travelStyle||'not specified')));
    if(a.notes) lines.push('- Special notes: '+a.notes);

    var daysNum=a.duration||7;
    var langNote=lang==='en'?'English':'Spanish (Rioplatense)';

    return 'You are Weygo, an ultra-premium AI travel concierge. Create a deeply personalized trip itinerary.\n\n'+
      lines.join('\n')+'\n\n'+
      'Respond ONLY with valid JSON in '+langNote+' using this exact schema:\n\n'+
      '{\n'+
      '  "destination": "City or Region, Country",\n'+
      '  "tagline": "A short poetic phrase (8-12 words)",\n'+
      '  "justification": "2-3 sentences explaining why this is perfect for THIS traveler",\n'+
      '  "budget_estimate": "e.g. $2,500 – $4,000 per person (excl. flights)",\n'+
      '  "best_season": "Best time to visit and why",\n'+
      '  "star_experience": "The single most special experience for this traveler",\n'+
      '  "itinerary": [{"day":1,"title":"Day title","morning":"Activity with real place","afternoon":"Activity with real place","evening":"Activity with real place","stay":"Hotel recommendation"}],\n'+
      '  "booking": {"flights":[{"name":"Platform","url":"URL with dates","note":"tip"}],"hotels":[{"name":"Platform","url":"URL","note":"tip"}],"experiences":[{"name":"Name","url":"URL","note":"tip"}],"transport":[{"name":"Option","url":"URL","note":"tip"}],"insurance":[{"name":"Provider","url":"URL","note":"tip"}]},\n'+
      '  "sport_resources": [{"name":"Resource","url":"URL","note":"tip"}],\n'+
      '  "concierge_tips": ["Practical local tip 1","Tip 2","Tip 3","Tip 4","Tip 5"],\n'+
      '  "visa": "Visa requirements for their passport at this destination",\n'+
      '  "alternatives": [{"destination":"City, Country","tagline":"phrase","reason":"why it fits"},{"destination":"City, Country","tagline":"phrase","reason":"why it fits"}]\n'+
      '}\n\n'+
      'Generate exactly '+daysNum+' days. Use real specific place names. Pre-fill booking URLs with dates ('+( a.dates_from||'')+' to '+(a.dates_to||'')+') where the platform supports it.\n\n'+
      'CRITICAL RULES:\n'+
      '1. Visa and entry requirements MUST appear ONLY in the "visa" field. Do NOT mention visas, ESTA, entry permits or passport requirements in concierge_tips, justification, itinerary or any other field.\n'+
      '2. concierge_tips must be practical local tips only: what to pack, transport, etiquette, currency, safety, seasonal advice.\n'+
      '3. Return ONLY the JSON — no markdown, no explanation.';
  }

  // ============================================================
  //  API CALL (streaming)
  // ============================================================
  function callClaude(apiKey, prompt) {
    var payload = { model:'claude-sonnet-4-6', max_tokens:16000, stream:true, messages:[{role:'user',content:prompt}] };
    var url, headers;
    if (isDeployed()) {
      url = '/api/chat'; headers = {'Content-Type':'application/json'};
    } else {
      url = 'https://api.anthropic.com/v1/messages';
      headers = {'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'};
    }
    fetch(url, {method:'POST', headers:headers, body:JSON.stringify(payload)})
    .then(function(res) {
      if(res.status===401) throw Object.assign(new Error('auth'),{isAuth:true});
      if(!res.ok) return res.json().then(function(b){ throw new Error((b.error&&b.error.message)||'HTTP '+res.status); }).catch(function(e){if(e.isAuth)throw e;throw new Error('HTTP '+res.status);});
      return readStream(res);
    })
    .then(function(text) {
      if(!text) throw new Error('Empty response from AI.');
      var cleaned=text.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim();
      renderResult(JSON.parse(cleaned));
    })
    .catch(function(err) {
      console.error('[Weygo]',err);
      if(err.isAuth) renderAuthError();
      else renderError(err.message||'Unknown error');
    });
  }

  function readStream(response) {
    return new Promise(function(resolve, reject) {
      var reader=response.body.getReader(), decoder=new TextDecoder(), fullText='', buffer='';
      function read() {
        reader.read().then(function(result) {
          if(result.done){ resolve(fullText); return; }
          buffer+=decoder.decode(result.value,{stream:true});
          var lines=buffer.split('\n'); buffer=lines.pop();
          lines.forEach(function(line) {
            if(!line.startsWith('data: ')) return;
            var data=line.slice(6).trim();
            if(data==='[DONE]') return;
            try {
              var evt=JSON.parse(data);
              if(evt.type==='content_block_delta'&&evt.delta&&evt.delta.text) fullText+=evt.delta.text;
              if(evt.content&&evt.content[0]&&evt.content[0].text) fullText=evt.content[0].text;
            } catch(e){}
          });
          read();
        }).catch(reject);
      }
      read();
    });
  }

  // ============================================================
  //  RENDER RESULT
  // ============================================================
  function renderResult(data) {
    isSubmitting = false;
    currentItinerary = data;

    // Save profile answers for next trip
    localStorage.setItem('weygo_profile', JSON.stringify({
      origin: answers.origin, passport: answers.passport,
      gender: answers.gender, age: answers.age, companions: answers.companions
    }));

    var loadingEl=el('loading-screen'); if(loadingEl) loadingEl.setAttribute('hidden','');
    var resultPanelEl=el('result-panel'); if(resultPanelEl) resultPanelEl.removeAttribute('hidden');
    var panel=el('quiz-panel'); if(panel) panel.classList.add('result-mode');

    var body=el('quiz-body');
    if (body) {
      var lbl=lang==='en'?'Your perfect journey':'Tu viaje perfecto';
      var budget=data.budget_estimate||'';
      var best=data.best_season||'';
      var star=data.star_experience||'';
      var urgency=lang==='en'?'Prices for these dates tend to rise 15–20% over the next 30 days. Booking early always pays off.':'Los precios para estas fechas suelen subir entre un 15-20% en los próximos 30 días. Reservar temprano siempre conviene.';
      body.innerHTML='<div class="result-summary">'+
        '<p class="rs-label">'+esc(lbl)+'</p>'+
        '<h2 class="rs-dest">'+esc(data.destination||'')+'</h2>'+
        '<p class="rs-tagline">'+esc(data.tagline||'')+'</p>'+
        '<div class="result-meta">'+
        (budget?'<div class="result-meta-item"><span class="rmi-label">'+(lang==='en'?'Budget':'Presupuesto')+'</span><span class="rmi-value">'+esc(budget)+'</span></div>':'') +
        (best?'<div class="result-meta-item"><span class="rmi-label">'+(lang==='en'?'Best time':'Mejor época')+'</span><span class="rmi-value">'+esc(best.split('.')[0])+'</span></div>':'') +
        (star?'<div class="result-meta-item"><span class="rmi-label">'+(lang==='en'?'Star exp.':'Estrella')+'</span><span class="rmi-value">'+esc(star)+'</span></div>':'') +
        '</div>'+
        '<p class="urgency-msg">'+esc(urgency)+'</p>'+
        '</div>';

      // Save my trip section
      body.innerHTML += '<div class="save-trip-section">'+
        '<p class="st-label" data-en="Save my trip" data-es="Guardar mi viaje">'+(lang==='en'?'Save my trip':'Guardar mi viaje')+'</p>'+
        '<p style="font-size:.75rem;color:var(--ink-faint);margin-bottom:.75rem;" data-en="Receive your complete itinerary by email." data-es="Recibí tu itinerario completo por email.">'+(lang==='en'?'Receive your complete itinerary by email.':'Recibí tu itinerario completo por email.')+'</p>'+
        '<div class="st-form"><input type="email" class="st-input" id="st-email" placeholder="your@email.com"><button class="st-send" id="st-send">'+(lang==='en'?'Send':'Enviar')+'</button></div>'+
        '<p class="st-confirm" id="st-confirm">'+(lang==='en'?'✓ Saved! We\'ll notify you of any price changes.':'✓ ¡Guardado! Te avisaremos si los precios cambian.')+'</p>'+
        '</div>';

      var stSend = el('st-send');
      if (stSend) stSend.addEventListener('click', function() {
        var emailInp = el('st-email');
        var email = emailInp ? emailInp.value.trim() : '';
        if (!email || !email.includes('@')) { if(emailInp) emailInp.style.borderColor='var(--danger)'; return; }
        localStorage.setItem('weygo_saved_email', email);
        localStorage.setItem('weygo_saved_trip', JSON.stringify({ email:email, destination:data.destination, date:new Date().toISOString() }));
        var conf = el('st-confirm'); if(conf) conf.classList.add('visible');
        if(emailInp) emailInp.style.borderColor='';
      });
    }

    var footer=el('quiz-footer');
    if (footer) {
      footer.innerHTML='<button class="btn-restart" id="btn-restart">'+(lang==='en'?'← Plan another trip':'← Planear otro viaje')+'</button>';
      el('btn-restart').addEventListener('click', restartQuiz);
    }

    var rc=el('result-content'); if(!rc) return;
    rc.innerHTML = buildResultHTML(data);

    rc.querySelectorAll('.day-header').forEach(function(hdr){
      hdr.addEventListener('click',function(){ hdr.closest('.day-item').classList.toggle('is-open'); });
    });
    var firstDay=rc.querySelector('.day-item'); if(firstDay) firstDay.classList.add('is-open');

    var btnPrint=el('btn-print'); if(btnPrint) btnPrint.addEventListener('click',function(){window.print();});
    var btnDl=el('btn-download'); if(btnDl) btnDl.addEventListener('click',function(){downloadItinerary(data);});

    var resultPanelNode=el('result-panel'); if(resultPanelNode) resultPanelNode.scrollTop=0;
    startSlideshowTimer();
  }

  function buildResultHTML(d) {
    var h='';
    var dlLabel=lang==='en'?'↓ Download itinerary':'↓ Descargar itinerario';
    var prtLabel=lang==='en'?'⊙ Print / Save PDF':'⊙ Imprimir / PDF';
    h+='<div class="result-download-bar"><button id="btn-download" class="rdb-btn rdb-primary">'+dlLabel+'</button><button id="btn-print" class="rdb-btn rdb-ghost">'+prtLabel+'</button></div>';

    h+='<div class="result-hero">';
    h+='<p class="result-hero-label">'+(lang==='en'?'Your Weygo Itinerary':'Tu Itinerario Weygo')+'</p>';
    h+='<h1 class="result-destination">'+esc(d.destination||'')+'</h1>';
    h+='<p class="result-tagline-big">'+esc(d.tagline||'')+'</p>';
    if(d.justification) h+='<p class="result-justification">'+esc(d.justification)+'</p>';
    h+='</div>';

    h+='<div class="result-stats">';
    if(d.budget_estimate) h+='<div class="stat-item"><p class="stat-label">'+(lang==='en'?'Budget':'Presupuesto')+'</p><p class="stat-value">'+esc(d.budget_estimate)+'</p><p class="stat-urgency">'+(lang==='en'?'Prices may rise 15–20% in the next 30 days.':'Los precios suelen subir 15–20% en los próximos 30 días.')+'</p></div>';
    if(d.best_season) h+='<div class="stat-item"><p class="stat-label">'+(lang==='en'?'Best Season':'Mejor Época')+'</p><p class="stat-value">'+esc(d.best_season)+'</p></div>';
    if(d.star_experience) h+='<div class="stat-item"><p class="stat-label">'+(lang==='en'?'Star Experience':'Exp. Estrella')+'</p><p class="stat-value">'+esc(d.star_experience)+'</p></div>';
    if(answers.duration) h+='<div class="stat-item"><p class="stat-label">'+(lang==='en'?'Duration':'Duración')+'</p><p class="stat-value">'+answers.duration+(lang==='en'?' days':' días')+'</p></div>';
    h+='</div>';

    if(d.itinerary&&d.itinerary.length) {
      h+='<div class="result-section"><h3 class="result-section-title">'+(lang==='en'?'Day by Day':'Día a Día')+'</h3><div class="itinerary-days">';
      d.itinerary.forEach(function(day){
        h+='<div class="day-item"><div class="day-header"><span class="day-num">'+(lang==='en'?'Day ':'Día ')+( day.day||'')+'</span><span class="day-title-text">'+esc(day.title||'')+'</span><svg class="day-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="6 9 12 15 18 9"/></svg></div><div class="day-body">';
        if(day.morning) h+='<div class="day-slot"><p class="slot-time">'+(lang==='en'?'Morning':'Mañana')+'</p><p class="slot-activity">'+esc(day.morning)+'</p></div>';
        if(day.afternoon) h+='<div class="day-slot"><p class="slot-time">'+(lang==='en'?'Afternoon':'Tarde')+'</p><p class="slot-activity">'+esc(day.afternoon)+'</p></div>';
        if(day.evening) h+='<div class="day-slot"><p class="slot-time">'+(lang==='en'?'Evening':'Noche')+'</p><p class="slot-activity">'+esc(day.evening)+'</p></div>';
        if(day.stay) h+='<p class="day-stay"><strong>'+(lang==='en'?'Where to stay:':'Dónde quedarse:')+'</strong> '+esc(day.stay)+'</p>';
        h+='</div></div>';
      });
      h+='</div></div>';
    }

    if(d.booking) {
      h+='<div class="result-section"><h3 class="result-section-title">'+(lang==='en'?'Reserve Your Trip':'Reservá tu Viaje')+'</h3>';
      var cats=[{key:'flights',en:'Flights',es:'Vuelos'},{key:'hotels',en:'Accommodation',es:'Alojamiento'},{key:'experiences',en:'Experiences',es:'Experiencias'},{key:'transport',en:'Local Transport',es:'Transporte Local'},{key:'insurance',en:'Travel Insurance',es:'Seguro de Viaje'}];
      cats.forEach(function(cat){
        var links=d.booking[cat.key]; if(!links||!links.length) return;
        h+='<div class="booking-category"><p class="booking-cat-title">'+(lang==='en'?cat.en:cat.es)+'</p><div class="booking-links-list">';
        links.forEach(function(lnk){
          h+='<div class="booking-link-item"><a href="'+esc(lnk.url||'#')+'" target="_blank" rel="noopener"><div class="bli-info"><p class="bli-name">'+esc(lnk.name||'')+'</p>'+(lnk.note?'<p class="bli-note">'+esc(lnk.note)+'</p>':'')+'</div><span class="bli-arrow">↗</span></a></div>';
        });
        h+='</div></div>';
      });
      h+='</div>';
    }

    if(d.sport_resources&&d.sport_resources.length) {
      h+='<div class="result-section"><h3 class="result-section-title">'+(lang==='en'?'Sport Resources':'Recursos Deportivos')+'</h3><div class="booking-links-list">';
      d.sport_resources.forEach(function(lnk){
        h+='<div class="booking-link-item"><a href="'+esc(lnk.url||'#')+'" target="_blank" rel="noopener"><div class="bli-info"><p class="bli-name">'+esc(lnk.name||'')+'</p>'+(lnk.note?'<p class="bli-note">'+esc(lnk.note)+'</p>':'')+'</div><span class="bli-arrow">↗</span></a></div>';
      });
      h+='</div></div>';
    }

    if(d.concierge_tips&&d.concierge_tips.length) {
      h+='<div class="result-section"><h3 class="result-section-title">'+(lang==='en'?'Concierge Tips':'Consejos del Concierge')+'</h3><div class="tips-list">';
      d.concierge_tips.forEach(function(tip,i){
        h+='<div class="tip-item"><span class="tip-num">0'+(i+1)+'</span><p class="tip-text">'+esc(tip)+'</p></div>';
      });
      h+='</div></div>';
    }

    // Visa section with prominent warning
    var visaWarning = lang==='en'
      ? '⚠️ Visa requirements change frequently. Always verify with the official embassy of your destination before travelling. Weygo does not guarantee the accuracy of this information.'
      : '⚠️ Los requisitos de visa cambian frecuentemente. Verificá siempre con la embajada oficial del destino antes de viajar. Weygo no garantiza la exactitud de esta información.';
    var visaLinks = lang==='en'
      ? [{name:'IATA Travel Centre (official visa checker)',url:'https://www.iatatravelcentre.com/'},{name:'Sherpa — Visa & entry requirements',url:'https://apply.joinsherpa.com/travel-restrictions'},{name:'Find your destination\'s embassy',url:'https://www.embassy-worldwide.com/'}]
      : [{name:'IATA Travel Centre (verificador oficial de visas)',url:'https://www.iatatravelcentre.com/'},{name:'Sherpa — Requisitos de entrada y visa',url:'https://apply.joinsherpa.com/travel-restrictions'},{name:'Encontrá la embajada de tu destino',url:'https://www.embassy-worldwide.com/'}];

    h+='<div class="result-section"><h3 class="result-section-title">'+(lang==='en'?'Visa Information':'Información de Visa')+'</h3>';
    h+='<div class="visa-warning">'+esc(visaWarning)+'</div>';
    if(d.visa) {
      h+='<div class="visa-box"><p class="visa-ai-label">'+(lang==='en'?'AI summary — verify before acting on this:':'Resumen IA — verificá antes de tomar decisiones:')+'</p>'+esc(d.visa)+'</div>';
    }
    h+='<div class="visa-official"><p class="visa-official-label">'+(lang==='en'?'Official sources:':'Fuentes oficiales:')+'</p><div class="booking-links-list">';
    visaLinks.forEach(function(lnk){
      h+='<div class="booking-link-item"><a href="'+esc(lnk.url)+'" target="_blank" rel="noopener"><div class="bli-info"><p class="bli-name">'+esc(lnk.name)+'</p></div><span class="bli-arrow">↗</span></a></div>';
    });
    h+='</div></div></div>';

    if(d.alternatives&&d.alternatives.length) {
      h+='<div class="result-section"><h3 class="result-section-title">'+(lang==='en'?'Alternative Destinations':'Destinos Alternativos')+'</h3><div class="alternatives-grid">';
      d.alternatives.forEach(function(alt){
        h+='<div class="alt-card"><p class="alt-dest">'+esc(alt.destination||'')+'</p><p class="alt-tagline">'+esc(alt.tagline||'')+'</p><p class="alt-reason">'+esc(alt.reason||'')+'</p></div>';
      });
      h+='</div></div>';
    }

    // Footer legal note
    h+='<div style="text-align:center;padding:2rem 0 1rem;font-size:.72rem;color:var(--ink-faint);border-top:1px solid var(--line);margin-top:2rem;">'+(lang==='en'?'Weygo may earn a commission when you book through our links, at no additional cost to you.':'Weygo puede ganar una comisión cuando reservás a través de nuestros links, sin costo adicional para vos.')+'</div>';

    return h;
  }

  // ============================================================
  //  ERROR HANDLERS
  // ============================================================
  function renderError(msg) {
    isSubmitting = false;
    var ls=el('loading-screen'); if(ls) ls.setAttribute('hidden','');
    var s=el('slideshow'); if(s) s.style.display='';
    startSlideshowTimer();
    var body=el('quiz-body'); if(!body) return;
    body.innerHTML='<div class="question-wrap"><div class="error-box"><strong>'+(lang==='en'?'Something went wrong':'Algo salió mal')+'</strong>'+esc(msg)+'<br><br>'+(lang==='en'?'Check your connection and try again.':'Verificá tu conexión e intentá de nuevo.')+'</div></div>';
    var bc=el('btn-continue');
    if(bc) { bc.disabled=false; bc.classList.remove('is-loading'); bc.onclick=function(){submitQuiz();}; }
  }
  function renderAuthError() {
    isSubmitting = false;
    var ls=el('loading-screen'); if(ls) ls.setAttribute('hidden','');
    var s=el('slideshow'); if(s) s.style.display='';
    startSlideshowTimer();
    var body=el('quiz-body'); if(!body) return;
    body.innerHTML='<div class="question-wrap"><div class="error-box"><strong>'+(lang==='en'?'Invalid API key':'API key inválida')+'</strong>'+(lang==='en'?'Anthropic rejected your key. Verify it at console.anthropic.com.':'Anthropic rechazó la clave. Verificala en console.anthropic.com.')+'</div></div>';
    var bc=el('btn-continue');
    if(bc) { bc.disabled=false; bc.classList.remove('is-loading'); bc.textContent=lang==='en'?'Update API key':'Actualizar clave'; bc.onclick=function(){ el('api-key-input').value=''; el('api-modal').removeAttribute('hidden'); bc.onclick=null; }; }
  }

  // ============================================================
  //  DOWNLOAD
  // ============================================================
  function downloadItinerary(data) {
    var dest=(data.destination||'itinerary').toLowerCase().replace(/[^a-z0-9]+/g,'-');
    var dateStr=new Date().toLocaleDateString(lang==='es'?'es-AR':'en-US',{year:'numeric',month:'long',day:'numeric'});
    var css='*{box-sizing:border-box;margin:0;padding:0}body{font-family:"DM Sans",system-ui,sans-serif;background:#F7F3EE;color:#1C1917}'+
      '.doc-header{background:#1C1917;padding:2rem 3rem;display:flex;align-items:center;justify-content:space-between}.doc-logo{font-family:"Cormorant Garamond",Georgia,serif;font-size:1.5rem;font-weight:300;letter-spacing:.22em;text-transform:uppercase;color:#B8A882}.doc-date{font-size:.75rem;color:rgba(255,255,255,.4)}'+
      '.doc-body{max-width:820px;margin:0 auto;padding:3rem 2rem}.result-download-bar{display:none}.day-body{display:block!important}.day-chevron{display:none}'+
      '.result-hero{margin-bottom:2.5rem;padding-bottom:2.5rem;border-bottom:1px solid rgba(28,25,23,.1)}.result-destination{font-family:"Cormorant Garamond",Georgia,serif;font-size:2.75rem;font-weight:300;color:#1C1917;margin-bottom:.5rem}.result-tagline-big{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-size:1.2rem;color:#78716C;margin-bottom:1.5rem}.result-justification{font-size:.9rem;color:#44403C;line-height:1.75}'+
      '.result-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:rgba(28,25,23,.1);border:1px solid rgba(28,25,23,.1);margin-bottom:2.5rem}.stat-item{background:#fff;padding:1.25rem 1.5rem}.stat-label{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:#A8A29E;margin-bottom:.4rem}.stat-value{font-family:"Cormorant Garamond",Georgia,serif;font-size:1rem;color:#44403C}'+
      '.result-section{margin-bottom:2.5rem}.result-section-title{font-family:"Cormorant Garamond",Georgia,serif;font-size:1.35rem;color:#1C1917;margin-bottom:1.25rem;padding-bottom:.75rem;border-bottom:1px solid rgba(28,25,23,.1)}'+
      '.day-item{border:1px solid rgba(28,25,23,.1);margin-bottom:.5rem;break-inside:avoid}.day-header{display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;background:#fff}.day-num{font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:#B8A882;width:40px}.day-title-text{font-family:"Cormorant Garamond",Georgia,serif;font-size:1rem;color:#1C1917}.day-body{padding:1rem 1.25rem 1.25rem;background:#F7F3EE;border-top:1px solid rgba(28,25,23,.1)}.day-slot{margin-bottom:.875rem}.slot-time{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:#A8A29E;margin-bottom:.25rem}.slot-activity{font-size:.875rem;color:#44403C;line-height:1.6}.day-stay{margin-top:.875rem;padding-top:.875rem;border-top:1px solid rgba(28,25,23,.1);font-size:.8rem;color:#78716C}'+
      '.booking-category{margin-bottom:1.75rem}.booking-cat-title{font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:#78716C;margin-bottom:.75rem;padding-bottom:.5rem;border-bottom:1px solid rgba(28,25,23,.1)}.booking-links-list{display:flex;flex-direction:column;gap:.5rem}.booking-link-item{border:1px solid rgba(28,25,23,.1);background:#fff}.booking-link-item a{display:flex;align-items:center;justify-content:space-between;padding:.875rem 1.125rem;text-decoration:none;color:inherit}.bli-name{font-size:.875rem;color:#44403C}.bli-arrow{color:#2C4A3E}'+
      '.tips-list{display:flex;flex-direction:column;gap:1rem}.tip-item{display:flex;gap:1.25rem}.tip-num{font-family:"Cormorant Garamond",Georgia,serif;font-size:1.25rem;color:#B8A882;flex-shrink:0}.tip-text{font-size:.875rem;color:#44403C;line-height:1.65}'+
      '.visa-warning{background:#FEF9EC;border:1px solid #B8A882;border-left:3px solid #B8A882;padding:.875rem 1.125rem;font-size:.82rem;color:#6B5B2E;line-height:1.6;margin-bottom:1rem}.visa-box{background:#fff;border:1px solid rgba(28,25,23,.1);padding:1.5rem;font-size:.875rem;color:#44403C;line-height:1.7;margin-bottom:1rem}.visa-ai-label{font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:#A8A29E;margin-bottom:.6rem}.visa-official-label{font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#78716C;margin-bottom:.75rem}'+
      '.alternatives-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.alt-card{border:1px solid rgba(28,25,23,.1);padding:1.5rem;background:#fff}.alt-dest{font-family:"Cormorant Garamond",Georgia,serif;font-size:1.2rem;color:#1C1917;margin-bottom:.25rem}.alt-tagline{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-size:.875rem;color:#B8A882;margin-bottom:.75rem}.alt-reason{font-size:.8rem;color:#78716C;line-height:1.6}'+
      '.result-hero-label{font-size:.7rem;letter-spacing:.15em;text-transform:uppercase;color:#B8A882;margin-bottom:1rem}.stat-urgency{font-style:italic;font-size:.75rem;color:#B8A882;margin-top:.5rem}';

    var html='<!DOCTYPE html><html lang="'+lang+'"><head><meta charset="UTF-8"><title>Weygo — '+esc(data.destination||'Itinerary')+'</title>'+
      '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">'+
      '<style>'+css+'</style></head><body>'+
      '<div class="doc-header"><div class="doc-logo">Weygo</div><div class="doc-date">'+dateStr+'</div></div>'+
      '<div class="doc-body">'+buildResultHTML(data)+'</div>'+
      '</body></html>';

    var blob=new Blob([html],{type:'text/html;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a'); a.href=url; a.download='weygo-'+dest+'.html';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){URL.revokeObjectURL(url);},2000);
  }

  // ============================================================
  //  RESTART (with profile pre-fill)
  // ============================================================
  function restartQuiz() {
    isSubmitting = false;
    prefilledProfile = false;

    // Try to load saved profile
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem('weygo_profile')||'{}'); } catch(e){}

    var profileFields = ['origin','passport','gender','age','companions'];
    var hasProfile = profileFields.some(function(k){ return saved[k]; });

    if (hasProfile) {
      // Pre-fill profile answers
      answers = { origin:saved.origin, passport:saved.passport, gender:saved.gender, age:saved.age, companions:saved.companions };
      prefilledProfile = true;
      // Start from budget question (index 7 in QUESTIONS = budget)
      computeVisible();
      currentIdx = visibleQuestions.findIndex(function(q){ return q.id==='budget'; });
      if (currentIdx < 0) currentIdx = 0;
    } else {
      answers = {};
      currentIdx = 0;
    }

    // Reset UI
    var panel=el('quiz-panel'); if(panel) panel.classList.remove('result-mode');
    var rp=el('result-panel'); if(rp) rp.setAttribute('hidden','');
    var ls=el('loading-screen'); if(ls) ls.setAttribute('hidden','');
    var s=el('slideshow'); if(s) s.style.display='';

    // Restore footer
    var footer=el('quiz-footer');
    if (footer) {
      footer.innerHTML='<button id="btn-back" class="btn-nav btn-back" '+(currentIdx===0?'disabled':'')+'><span class="btn-nav-arrow">←</span><span data-en="Back" data-es="Atrás">'+(lang==='en'?'Back':'Atrás')+'</span></button><button id="btn-continue" class="btn-nav btn-continue"><span data-en="Continue" data-es="Continuar">'+(lang==='en'?'Continue':'Continuar')+'</span><span class="btn-nav-arrow">→</span></button>';
      initNav();
    }
    renderQuestion();
    startSlideshowTimer();
  }

  // ============================================================
  //  SMOOTH SCROLL for header nav
  // ============================================================
  function initSiteNav() {
    document.addEventListener('click', function(e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (!id || id==='#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 62;
      window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - headerH, behavior:'smooth' });
    });
  }

  // ============================================================
  //  BOOT
  // ============================================================
  function init() {
    safe(initApiModal,    'apiModal');
    safe(initLangToggles, 'langToggle');
    safe(initSlideshow,   'slideshow');
    safe(initQuizOverlay, 'quizOverlay');
    safe(initNav,         'nav');
    safe(initExplore,     'explore');
    safe(initBlog,        'blog');
    safe(initSiteNav,     'siteNav');
    safe(renderQuestion,  'renderQuestion');
  }

  document.addEventListener('DOMContentLoaded', init);

})();
