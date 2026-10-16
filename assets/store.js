/*
  CLANDES PREMIUM
  Tienda publica con tarjetas premium
  PARTE 1 DE 3
*/

import {
  db,
  $,
  notice,
  safeUrl,
  applyAccent,
  renderBackdrop,
  currency
} from './shared.js';

const params = new URLSearchParams(window.location.search);

const username = params.get('usuario') || 'berrydigital';

let products = [];

function clean(value, fallback = '') {
  return typeof value === 'string'
    ? value.trim() || fallback
    : fallback;
}

function getShopName(shop) {
  return clean(
    shop.nombre_visible,
    clean(shop.nombre, 'Mi tienda')
  );
}

function renderLogo(shop, name) {
  const logo = $('shopLogo');
  const emoji = clean(shop.logo_emoji);
  const imageUrl = clean(shop.logo_url);

  const initial =
    Array.from(name)[0]?.toLocaleUpperCase('es') || 'T';

  const fallback = emoji || initial;

  if (!logo) {
    if ($('logoInitial')) {
      $('logoInitial').textContent = fallback;
    }
    return;
  }

  logo.replaceChildren();
  logo.setAttribute('aria-label', 'Logo de ' + name);

  function showSymbol() {
    logo.replaceChildren();

    const symbol = document.createElement('span');
    symbol.textContent = fallback;
    symbol.style.fontSize = emoji ? '1.6rem' : '1.4rem';
    symbol.style.lineHeight = '1';

    logo.append(symbol);
  }

  if (imageUrl && safeUrl(imageUrl)) {
    const img = document.createElement('img');

    img.src = imageUrl;
    img.alt = 'Logo de ' + name;

    Object.assign(img.style, {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
      borderRadius: 'inherit'
    });

    img.addEventListener('error', showSymbol, {
      once: true
    });

    logo.append(img);
  } else {
    showSymbol();
  }
}

function configureShop(shop) { 
  document.body.dataset.template = shop.plantilla || 'luxury';
  const name = getShopName(shop);

  document.title = name + ' | CLANDES PREMIUM';

  if ($('brand')) {
    $('brand').textContent = name;
  }

  if ($('shopTitle')) {
    $('shopTitle').textContent = name;
  }

  if ($('shopDesc')) {
    $('shopDesc').textContent = clean(
      shop.descripcion,
      'Bienvenido a nuestro catálogo digital'
    );
  }

  if ($('shopTag')) {
    $('shopTag').textContent = clean(
      shop.plantilla,
      'neon-tech'
    ).toUpperCase();
  }

  renderLogo(shop, name);

  document.body.dataset.theme =
    clean(shop.plantilla, 'neon-tech');

  applyAccent(shop.color_principal || '#D4AF37');

  if ($('hero')) {
    const video = clean(shop.video_fondo_url);
    const image = clean(shop.imagen_fondo_url);

    renderBackdrop(
      $('hero'),
      video || image,
      video ? 'video' : 'imagen'
    );
  }
}
// ESTILOS DE TARJETAS PREMIUM
function installCardStyles() {
  if (document.getElementById('clandes-card-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'clandes-card-styles';

  style.textContent = `
    #catalog .product.clandes-premium-card {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 0;
      border-radius: 18px;
      border: 1px solid var(--accent, #D4AF37);
      background: linear-gradient(
        145deg,
        #202230,
        #0c0d16
      );
      box-shadow: 0 10px 25px rgba(0,0,0,.25);
      transition: transform .25s, box-shadow .25s;
      min-width: 0;
    }

    #catalog .clandes-premium-card:hover,
    #catalog .clandes-premium-card:focus-within {
      transform: translateY(-4px);
      box-shadow:
        0 12px 30px rgba(0,0,0,.4),
        0 0 18px var(--accent, #D4AF37);
    }

    #catalog .clandes-media {
      position: relative;
      width: 100%;
      aspect-ratio: 4 / 3;
      overflow: hidden;
      background: #10121d;
      display: grid;
      place-items: center;
    }

    #catalog .clandes-media img,
    #catalog .clandes-media video {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    #catalog .clandes-media img {
      transition: transform .35s;
    }

    #catalog .clandes-premium-card:hover img {
      transform: scale(1.045);
    }

    #catalog .clandes-placeholder {
      font-size: 3.5rem;
      opacity: .7;
    }

    #catalog .clandes-tag {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 1;
      padding: 6px 9px;
      border-radius: 30px;
      background: rgba(0,0,0,.8);
      color: white;
      font-size: .7rem;
      font-weight: 800;
    }

    #catalog .clandes-card-body {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 9px;
      padding: 14px;
      min-width: 0;
    }

    #catalog .clandes-card-body h3 {
      margin: 0;
      font-size: 1.05rem;
      overflow-wrap: anywhere;
    }

    #catalog .clandes-card-description {
      margin: 0;
      color: #b8bccb;
      font-size: .84rem;
      line-height: 1.5;
      overflow-wrap: anywhere;
    }

    #catalog .clandes-card-bottom {
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      padding-top: 6px;
    }

    #catalog .clandes-price {
      color: var(--accent, #D4AF37);
      font-size: 1.3rem;
      font-weight: 900;
    }

    #catalog .clandes-stock {
      padding: 5px 8px;
      border-radius: 30px;
      background: rgba(38,166,91,.15);
      color: #81e6a6;
      font-size: .7rem;
      font-weight: 700;
    }

    #catalog .clandes-stock.is-empty {
      background: rgba(255,154,50,.15);
      color: #f9bd77;
    }

    @media (max-width: 600px) {
      #catalog .clandes-media {
        aspect-ratio: 1 / 1;
      }

      #catalog .clandes-card-body {
        padding: 11px;
      }

      #catalog .clandes-price {
        font-size: 1.1rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #catalog .clandes-premium-card,
      #catalog .clandes-media img {
        transition: none;
      }
    }
  `;

  document.head.append(style);
}

// CREAR TARJETA DE PRODUCTO
function makeCard(product) {
  const card = document.createElement('article');
  card.className = 'product clandes-premium-card';

  const media = document.createElement('div');
  media.className = 'clandes-media';

  const videoUrl = clean(product.video_url);
  const imageUrl = clean(product.imagen_url);

  let type = 'none';

  if (videoUrl && safeUrl(videoUrl)) {
    const video = document.createElement('video');

    video.src = videoUrl;
    video.controls = false;
video.autoplay = true;
video.loop = true;
video.muted = true;
video.defaultMuted = true;
video.playsInline = true;
video.preload = 'metadata';

video.setAttribute('autoplay', '');
video.setAttribute('loop', '');
video.setAttribute('muted', '');
video.setAttribute('playsinline', '');

    if (imageUrl && safeUrl(imageUrl)) {
      video.poster = imageUrl;
    }

    media.append(video);
    type = 'video';

  } else if (imageUrl && safeUrl(imageUrl)) {
    const img = document.createElement('img');

    img.src = imageUrl;
    img.alt = 'Imagen de ' + clean(
      product.nombre,
      'producto'
    );
    img.loading = 'lazy';

    img.addEventListener('error', () => {
      media.replaceChildren();

      const fallback = document.createElement('span');
      fallback.className = 'clandes-placeholder';
      fallback.textContent = '📦';

      media.append(fallback);
    }, { once: true });

    media.append(img);
    type = 'image';

  } else {
    const placeholder = document.createElement('span');
    placeholder.className = 'clandes-placeholder';
    placeholder.textContent = '📦';
    media.append(placeholder);
  }

  if (type !== 'none') {
    const tag = document.createElement('span');
    tag.className = 'clandes-tag';
    tag.textContent =
      type === 'video' ? '▶ VIDEO' : '✦ DESTACADO';

    media.append(tag);
  }

  const body = document.createElement('div');
  body.className = 'clandes-card-body';

  const title = document.createElement('h3');
  title.textContent = clean(
    product.nombre,
    'Producto digital'
  );

  const description = document.createElement('p');
  description.className = 'clandes-card-description';
  description.textContent = clean(
    product.descripcion,
    'Producto digital'
  );

  const bottom = document.createElement('div');
  bottom.className = 'clandes-card-bottom';

  const price = document.createElement('strong');
  price.className = 'clandes-price';
  price.textContent = currency(product.precio);

  const stock = document.createElement('span');
  const available = Number(product.stock || 0) > 0;

  stock.className =
    'clandes-stock' + (available ? '' : ' is-empty');

  stock.textContent = available
    ? '● Disponible'
    : 'Consultar stock';

  bottom.append(price, stock);
  body.append(title, description, bottom);
  card.append(media, body);

  return card;
}
    // BUSCADOR Y CATALOGO
function paint() {
  const search = $('search');

  const query = search
    ? search.value.toLocaleLowerCase('es').trim()
    : '';

  const filtered = products.filter(product => {
    const words = (
      clean(product.nombre) + ' ' +
      clean(product.descripcion)
    ).toLocaleLowerCase('es');

    return words.includes(query);
  });

  if ($('counter')) {
    $('counter').textContent =
      filtered.length + ' productos';
  }

  const catalog = $('catalog');

  if (!catalog) return;

  catalog.replaceChildren();

  if (!filtered.length) {
    const empty = document.createElement('p');

    empty.className = 'muted';

    empty.textContent = query
      ? 'No encontramos productos con esa búsqueda.'
      : 'No hay productos activos disponibles.';

    catalog.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const product of filtered) {
    fragment.append(makeCard(product));
  }

  catalog.append(fragment);
}

// CARGAR TIENDA Y PRODUCTOS
async function init() {
  installCardStyles();

  try {
    const { data: shop, error: shopError } = await db
      .from('tiendas')
      .select(
        'id,nombre,nombre_visible,usuario,' +
        'descripcion,estado,plantilla,' +
        'color_principal,imagen_fondo_url,' +
        'video_fondo_url,logo_url,logo_emoji'
      )
      .eq('usuario', username)
      .eq('estado', 'activa')
      .maybeSingle();

    if (shopError) {
      throw shopError;
    }

    if (!shop) {
      throw Error('No se encontró una tienda activa.');
    }

    configureShop(shop);

    const { data, error: productError } = await db
      .from('productos')
      .select(
        'id,nombre,descripcion,precio,' +
        'stock,activo,imagen_url,video_url'
      )
      .eq('tienda_id', shop.id)
      .eq('activo', true)
      .order('nombre');

    if (productError) {
      throw productError;
    }

    products = data || [];

    paint();

  } catch (error) {
    console.error('CLANDES PREMIUM:', error);

    notice(
      'error',
      'No se pudo cargar la tienda: ' + error.message
    );
  }
}

// BUSCADOR EN TIEMPO REAL
if ($('search')) {
  $('search').addEventListener('input', paint);
}

// INICIAR TIENDA
init();
