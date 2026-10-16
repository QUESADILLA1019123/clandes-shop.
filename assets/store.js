
/*
  CLANDES PREMIUM
  Tienda publica personalizada
*/

import {
  db,
  $,
  notice,
  safeUrl,
  applyAccent,
  renderBackdrop,
  mediaNode,
  currency
} from './shared.js';

// USUARIO DE LA TIENDA
const params = new URLSearchParams(window.location.search);

const username =
  params.get('usuario') || 'berrydigital';

let products = [];

// TEXTO SEGURO
function clean(value, fallback = '') {
  return typeof value === 'string'
    ? value.trim() || fallback
    : fallback;
}

// NOMBRE PERSONALIZADO
function getShopName(shop) {
  return clean(
    shop.nombre_visible,
    clean(shop.nombre, 'Mi tienda')
  );
}

// LOGO, EMOJI O INICIAL
function renderLogo(shop, name) {
  const logo = $('shopLogo');
  const emoji = clean(shop.logo_emoji);
  const imageUrl = clean(shop.logo_url);

  const initial =
    Array.from(name)[0]?.toLocaleUpperCase('es') || 'T';

  const fallback = emoji || initial;

  if (!logo) {
    const oldLogo = $('logoInitial');

    if (oldLogo) {
      oldLogo.textContent = fallback;
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
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.display = 'block';
    img.style.borderRadius = 'inherit';

    img.addEventListener('error', showSymbol, {
      once: true
    });

    logo.append(img);
  } else {
    showSymbol();
  }
}

// IDENTIDAD Y DISEÑO
function configureShop(shop) {
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

// CREAR TARJETAS
function makeCard(product) {
  const card = document.createElement('article');
  card.className = 'product';

  const type = product.video_url
    ? 'video'
    : 'imagen';

  const media = mediaNode(
    product.video_url || product.imagen_url,
    type
  );

  if (media) {
    card.append(media);
  }

  const title = document.createElement('h3');
  title.textContent = clean(
    product.nombre,
    'Producto digital'
  );

  const description = document.createElement('p');
  description.textContent = clean(
    product.descripcion,
    'Producto digital'
  );

  const price = document.createElement('strong');
  price.textContent = currency(product.precio);

  const availability = document.createElement('p');
  availability.className = 'muted';

  availability.textContent =
    Number(product.stock || 0) > 0
      ? 'Stock: Disponible'
      : 'Stock: Consultar disponibilidad';

  card.append(
    title,
    description,
    price,
    availability
  );

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

    if (shopError) throw shopError;

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

    if (productError) throw productError;

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

// INICIAR
init();
