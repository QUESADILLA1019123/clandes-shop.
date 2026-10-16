
import {
  db,
  $,
  notice,
  applyAccent,
  renderBackdrop,
  mediaNode,
  currency
} from './shared.js';

const username =
  new URLSearchParams(window.location.search).get('usuario') ||
  'berrydigital';

let products = [];

// Mostrar los productos del catálogo
function paint() {
  const searchInput = $('search');

  const query = searchInput
    ? searchInput.value.toLocaleLowerCase('es').trim()
    : '';

  const shown = products.filter(product => {
    const text = (
      product.nombre + ' ' + (product.descripcion || '')
    ).toLocaleLowerCase('es');

    return text.includes(query);
  });

  const counter = $('counter');
  const catalog = $('catalog');

  if (counter) {
    counter.textContent = shown.length + ' productos';
  }

  if (!catalog) return;

  catalog.replaceChildren();

  if (!shown.length) {
    catalog.textContent =
      'No hay productos activos disponibles.';
    return;
  }

  for (const product of shown) {
    const card = document.createElement('article');
    card.className = 'product';

    // Imagen o video del producto
    const mediaType = product.video_url
      ? 'video'
      : 'imagen';

    const mediaUrl =
      product.video_url || product.imagen_url;

    const media = mediaNode(mediaUrl, mediaType);

    if (media) {
      card.append(media);
    }

    // Nombre
    const title = document.createElement('h3');
    title.textContent = product.nombre;

    // Descripción
    const description = document.createElement('p');
    description.textContent =
      product.descripcion || 'Producto digital';

    // Precio
    const price = document.createElement('strong');
    price.textContent = currency(product.precio);

    // Stock
    const stock = document.createElement('p');
    stock.className = 'muted';

    stock.textContent =
      Number(product.stock || 0) > 0
        ? 'Stock: Disponible'
        : 'Stock: Consultar disponibilidad';

    card.append(
      title,
      description,
      price,
      stock
    );

    catalog.append(card);
  }
}

// Personalizar el encabezado de cada tienda
function configureHeader(shop) {
  const name = (shop.nombre || 'Mi tienda').trim();

  // Nombre sin corona
  const brand = $('brand');

  if (brand) {
    brand.textContent = name;
  }

  // Logo provisional con inicial del nombre
  const logoInitial = $('logoInitial');

  if (logoInitial) {
    logoInitial.textContent =
      name.charAt(0).toUpperCase() || 'T';
  }

  // Título principal
  const shopTitle = $('shopTitle');

  if (shopTitle) {
    shopTitle.textContent = name;
  }

  // Descripción
  const shopDesc = $('shopDesc');

  if (shopDesc) {
    shopDesc.textContent =
      shop.descripcion || 'Bienvenido a nuestro catálogo';
  }

  // Nombre de la plantilla
  const shopTag = $('shopTag');

  if (shopTag) {
    shopTag.textContent =
      (shop.plantilla || 'neon-tech').toUpperCase();
  }

  // Activar el tema visual de la tienda
  document.body.dataset.theme =
    shop.plantilla || 'neon-tech';

  // Color elegido por el vendedor
  applyAccent(shop.color_principal);

  // Imagen o video de fondo
  const hero = $('hero');

  if (hero) {
    renderBackdrop(
      hero,
      shop.video_fondo_url || shop.imagen_fondo_url,
      shop.video_fondo_url ? 'video' : 'imagen'
    );
  }

  document.title = name + ' | CLANDES PREMIUM';
}

// Cargar la tienda desde Supabase
async function init() {
  try {
    const { data: shop, error } = await db
      .from('tiendas')
      .select(
        'id,nombre,usuario,descripcion,estado,plantilla,color_principal,imagen_fondo_url,video_fondo_url'
      )
      .eq('usuario', username)
      .eq('estado', 'activa')
      .maybeSingle();

    if (error) throw error;

    if (!shop) {
      throw new Error(
        'No se encontró una tienda activa con ese usuario.'
      );
    }

    // Personalización individual
    configureHeader(shop);

    // Productos de esta tienda
    const { data, error: productsError } = await db
      .from('productos')
      .select(
        'id,nombre,descripcion,precio,stock,activo,imagen_url,video_url'
      )
      .eq('tienda_id', shop.id)
      .eq('activo', true)
      .order('nombre');

    if (productsError) throw productsError;

    products = data || [];

    paint();

  } catch (error) {
    console.error('Error al cargar tienda:', error);

    notice(
      'error',
      'No se pudo cargar la tienda: ' + error.message
    );
  }
}

// Buscador
const searchInput = $('search');

if (searchInput) {
  searchInput.addEventListener('input', paint);
}

// Iniciar tienda
init();
