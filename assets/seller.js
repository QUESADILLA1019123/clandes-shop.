
/*
=========================================
       CLANDES PREMIUM
       PANEL DEL VENDEDOR
=========================================

Identidad personalizada
Nombre, emoji y logotipo
Plantillas, colores y fondos
Productos y stock digital

=========================================
*/

import {
  db,
  $,
  PALETTES,
  notice,
  visible,
  safeUrl,
  applyAccent,
  renderBackdrop,
  currency
} from './shared.js';

// ======================================
// VARIABLES GENERALES
// ======================================

let shop = null;
let account = null;
let selected = null;

function setBusy(id, busy) {
  $(id).disabled = busy;
}

// ======================================
// COLORES DEL PANEL
// ======================================

for (const [name, color] of PALETTES) {
  const option = document.createElement('option');

  option.value = color;
  option.textContent = name + ' · ' + color;

  $('color').append(option);
}

// ======================================
// VISTA PREVIA DEL DISEÑO
// ======================================

function preview() {
  const color = $('color').value;

  applyAccent(color);

  $('preview').style.borderColor = color;

  renderBackdrop(
    $('preview'),
    $('backgroundUrl').value.trim(),
    $('backgroundType').value
  );
}

for (const id of [
  'color',
  'backgroundType',
  'template'
]) {
  $(id).addEventListener('change', preview);
}

$('backgroundUrl').addEventListener(
  'input',
  preview
);

// ======================================
// RECUPERAR DISEÑO GUARDADO
// ======================================

function hydrate() {
  $('shopName').textContent =
    shop.nombre_visible || shop.nombre;

  $('shopUser').textContent =
    '@' + shop.usuario;

  $('publicLink').href =
    'tienda.html?usuario=' +
    encodeURIComponent(shop.usuario);

  const templateExists =
    [...$('template').options].some(
      option => option.value === shop.plantilla
    );

  $('template').value = templateExists
    ? shop.plantilla
    : 'neon-tech';

  const savedColor = shop.color_principal;

  const matchingColor = PALETTES.find(
    palette =>
      palette[1].toLowerCase() ===
      (savedColor || '').toLowerCase()
  );

  $('color').value = matchingColor
    ? matchingColor[1]
    : '#D4AF37';

  $('backgroundType').value =
    shop.video_fondo_url
      ? 'video'
      : 'imagen';

  $('backgroundUrl').value =
    shop.video_fondo_url ||
    shop.imagen_fondo_url ||
    '';

  $('shopDescription').value =
    shop.descripcion || '';

  preview();
}

// ======================================
// IDENTIDAD DE MARCA
// ======================================

const identityName = $('identityName');
const identityMode = $('identityMode');
const identityEmoji = $('identityEmoji');
const identityLogoUrl = $('identityLogoUrl');

const identityPreviewName =
  $('identityPreviewName');

const identityPreviewIcon =
  $('identityPreviewIcon');

// ======================================
// VISTA PREVIA DE IDENTIDAD
// ======================================

function updateBrandPreview() {
  const name =
    identityName.value.trim() ||
    shop?.nombre ||
    'Mi tienda';

  const mode = identityMode.value;

  identityPreviewName.textContent = name;

  identityPreviewIcon.replaceChildren();

  const initial =
    Array.from(name)[0]?.toLocaleUpperCase('es') ||
    'T';

  if (mode === 'image') {
    const url = identityLogoUrl.value.trim();

    if (url && safeUrl(url)) {
      const image = document.createElement('img');

      image.src = url;
      image.alt = 'Logotipo de ' + name;

      image.onerror = () => {
        identityPreviewIcon.replaceChildren();
        identityPreviewIcon.textContent = initial;
      };

      identityPreviewIcon.append(image);
      return;
    }
  }

  if (mode === 'emoji') {
    identityPreviewIcon.textContent =
      identityEmoji.value.trim() || '🏪';
  } else {
    identityPreviewIcon.textContent = initial;
  }
}

// ======================================
// MOSTRAR CAMPOS DEL LOGOTIPO
// ======================================

function updateIdentityFields() {
  const mode = identityMode.value;

  visible(
    'identityEmojiBox',
    mode === 'emoji'
  );

  visible(
    'identityImageBox',
    mode === 'image'
  );

  updateBrandPreview();
}

// ======================================
// RECUPERAR IDENTIDAD GUARDADA
// ======================================

function hydrateIdentity() {
  if (!shop) return;

  // Nombre guardado en Supabase
  identityName.value =
    shop.nombre_visible ||
    shop.nombre ||
    '';

  // Emoji guardado
  identityEmoji.value =
    shop.logo_emoji || '';

  // Imagen guardada
  identityLogoUrl.value =
    shop.logo_url || '';

  // Detectar el tipo de logotipo
  if (shop.logo_url) {
    identityMode.value = 'image';
  } else if (shop.logo_emoji) {
    identityMode.value = 'emoji';
  } else {
    identityMode.value = 'initial';
  }

  updateIdentityFields();
}

// ======================================
// EVENTOS DE IDENTIDAD
// ======================================

identityMode.addEventListener(
  'change',
  updateIdentityFields
);

identityName.addEventListener(
  'input',
  updateBrandPreview
);

identityEmoji.addEventListener(
  'input',
  updateBrandPreview
);

identityLogoUrl.addEventListener(
  'input',
  updateBrandPreview
);

// ======================================
// GUARDAR IDENTIDAD EN SUPABASE
// ======================================

$('saveIdentity').addEventListener(
  'click',
  async () => {
    if (!shop || !account) {
      notice(
        'identityMsg',
        'Primero inicia sesión.'
      );
      return;
    }

    setBusy('saveIdentity', true);

    try {
      const name =
        identityName.value.trim();

      const mode =
        identityMode.value;

      const emoji =
        identityEmoji.value.trim();

      const url =
        identityLogoUrl.value.trim();

      // Validaciones

      if (!name) {
        throw Error(
          'Escribe el nombre de tu tienda.'
        );
      }

      if (name.length > 80) {
        throw Error(
          'El nombre es demasiado largo.'
        );
      }

      if (mode === 'emoji' && !emoji) {
        throw Error(
          'Escribe un emoji personalizado.'
        );
      }

      if (
        mode === 'image' &&
        (!url || !safeUrl(url))
      ) {
        throw Error(
          'Introduce una URL HTTPS válida.'
        );
      }

      const changes = {
        nombre_visible: name,
        logo_emoji:
          mode === 'emoji' ? emoji : null,
        logo_url:
          mode === 'image' ? url : null
      };

      // Guardar únicamente la tienda
      // que pertenece al vendedor actual

      const { data, error } = await db
        .from('tiendas')
        .update(changes)
        .eq('id', shop.id)
        .eq('propietario_id', account.id)
        .select(
          'nombre_visible,logo_emoji,logo_url'
        );

      if (error) throw error;

      if (data?.length !== 1) {
        throw Error(
          'Supabase no confirmó el guardado.'
        );
      }

      // Actualizar datos locales

      Object.assign(shop, data[0]);

      $('shopName').textContent =
        shop.nombre_visible || shop.nombre;

      hydrateIdentity();

      notice(
        'identityMsg',
        '¡Identidad guardada correctamente!',
        true
      );

    } catch (error) {
      notice(
        'identityMsg',
        error.message
      );
    } finally {
      setBusy('saveIdentity', false);
    }
  }
);

// ======================================
// INICIAR SESIÓN Y CARGAR TIENDA
// ======================================

async function session() {
  const {
    data: { user },
    error
  } = await db.auth.getUser();

  if (error || !user) {
    shop = null;
    account = null;

    visible('dashboard', false);
    visible('login', true);

    return;
  }

  account = user;

  // MUY IMPORTANTE:
  // Recuperamos también los campos
  // de identidad personalizada.

  const res = await db
    .from('tiendas')
    .select(
      'id,nombre,usuario,descripcion,estado,' +
      'plantilla,color_principal,' +
      'imagen_fondo_url,video_fondo_url,' +
      'nombre_visible,logo_url,logo_emoji'
    )
    .eq('propietario_id', user.id)
    .limit(2);

  if (res.error) throw res.error;

  if (!res.data?.length) {
    throw Error(
      'No tienes una tienda vinculada.'
    );
  }

  if (res.data.length > 1) {
    throw Error(
      'Tienes varias tiendas vinculadas. ' +
      'Necesitamos un selector de tiendas.'
    );
  }

  if (res.data[0].estado !== 'activa') {
    throw Error(
      'Tu tienda no está activa.'
    );
  }

  shop = res.data[0];

  // Recuperar diseño
  hydrate();

  // Recuperar nombre, emoji y logo
  hydrateIdentity();

  visible('login', false);
  visible('dashboard', true);

  await loadProducts();
}

// ======================================
// FORMULARIO DE INICIO DE SESIÓN
// ======================================

$('loginForm').addEventListener(
  'submit',
  async event => {
    event.preventDefault();

    setBusy('signin', true);

    try {
      const res = await db.auth.signInWithPassword({
        email: $('email').value.trim(),
        password: $('password').value
      });

      if (res.error) throw res.error;

      

      await session();

    } catch (error) {
      notice(
        'loginMsg',
        error.message
      );
    } finally {
      setBusy('signin', false);
    }
  }
);

// ======================================
// CERRAR SESIÓN
// ======================================

$('logout').addEventListener(
  'click',
  async () => {
    const { error } = await db.auth.signOut();

    if (error) {
      notice('dashMsg', error.message);
      return;
    }

    shop = null;
    account = null;
    selected = null;

    visible('dashboard', false);
    visible('login', true);
    visible('stockSection', false);
  }
);

// ======================================
// GUARDAR DISEÑO
// ======================================

$('saveDesign').addEventListener(
  'click',
  async () => {
    if (!shop || !account) return;

    setBusy('saveDesign', true);

    try {
      const url =
        $('backgroundUrl').value.trim();

      if (url && !safeUrl(url)) {
        throw Error(
          'El fondo necesita una URL HTTPS válida.'
        );
      }

      const type =
        $('backgroundType').value;

      const changes = {
        plantilla:
          $('template').value,

        color_principal:
          $('color').value,

        descripcion:
          $('shopDescription').value.trim(),

        imagen_fondo_url:
          type === 'imagen' ? url || null : null,

        video_fondo_url:
          type === 'video' ? url || null : null
      };

      const res = await db
        .from('tiendas')
        .update(changes)
        .eq('id', shop.id)
        .eq('propietario_id', account.id)
        .select(
          'id,plantilla,color_principal,' +
          'descripcion,imagen_fondo_url,' +
          'video_fondo_url'
        );

      if (res.error) throw res.error;

      if (res.data?.length !== 1) {
        throw Error(
          'No se confirmó el guardado del diseño.'
        );
      }

      Object.assign(shop, res.data[0]);

      notice(
        'designMsg',
        'Diseño guardado correctamente.',
        true
      );

    } catch (error) {
      notice(
        'designMsg',
        error.message
      );
    } finally {
      setBusy('saveDesign', false);
    }
  }
);

// ======================================
// CREAR PRODUCTOS
// ======================================

$('productForm').addEventListener(
  'submit',
  async event => {
    event.preventDefault();

    if (!shop) return;

    setBusy('addProduct', true);

    try {
      const nombre =
        $('pname').value.trim();

      const precio =
        Number($('pprice').value);

      const imagen_url =
        $('pimage').value.trim();

      const video_url =
        $('pvideo').value.trim();

      if (
        !nombre ||
        !Number.isFinite(precio) ||
        precio < 0
      ) {
        throw Error(
          'Nombre o precio inválidos.'
        );
      }

      if (
        (imagen_url && !safeUrl(imagen_url)) ||
        (video_url && !safeUrl(video_url))
      ) {
        throw Error(
          'Usa URLs HTTPS válidas.'
        );
      }

      const res = await db
        .from('productos')
        .insert({
          tienda_id: shop.id,
          nombre,
          descripcion:
            $('pdesc').value.trim(),
          precio,
          stock: 0,
          activo: false,
          imagen_url:
            imagen_url || null,
          video_url:
            video_url || null
        })
        .select('id');

      if (res.error) throw res.error;

      if (!res.data?.length) {
        throw Error(
          'No se confirmó la creación.'
        );
      }

      $('productForm').reset();

      notice(
        'productMsg',
        'Producto creado como inactivo.',
        true
      );

      await loadProducts();

    } catch (error) {
      notice(
        'productMsg',
        error.message
      );
    } finally {
      setBusy('addProduct', false);
    }
  }
);

// ======================================
// CONSTRUIR CAMPOS DE EDICIÓN
// ======================================

function field(
  parent,
  label,
  value,
  kind = 'text'
) {
  const textLabel =
    document.createElement('label');

  textLabel.textContent = label;

  const element = document.createElement(
    kind === 'textarea' ? 'textarea' : 'input'
  );

  if (kind !== 'textarea') {
    element.type = kind;
  }

  element.value = value ?? '';

  parent.append(textLabel, element);

  return element;
}

// ======================================
// CARGAR Y EDITAR PRODUCTOS
// ======================================

async function loadProducts() {
  if (!shop) return;

  const res = await db
    .from('productos')
    .select(
      'id,nombre,descripcion,precio,stock,' +
      'activo,imagen_url,video_url'
    )
    .eq('tienda_id', shop.id)
    .order('id', {
      ascending: false
    });

  if (res.error) {
    notice(
      'dashMsg',
      'Error al cargar productos: ' +
      res.error.message
    );
    return;
  }

  const box = $('products');

  box.replaceChildren();

  if (!res.data?.length) {
    box.textContent =
      'Todavía no tienes productos.';
    return;
  }

  for (const product of res.data) {
    const item =
      document.createElement('div');

    item.className = 'rowline';

    const title =
      document.createElement('h3');

    title.textContent =
      product.nombre + ' · ' +
      currency(product.precio);

    const info =
      document.createElement('p');

    info.className = 'muted';

    info.textContent =
      'Stock mostrado: ' +
      (product.stock ?? 0) +
      ' · ' +
      (product.activo ? 'Activo' : 'Inactivo');

    item.append(title, info);

    // EDITOR DE PRODUCTO

    const edit =
      document.createElement('details');

    const summary =
      document.createElement('summary');

    summary.textContent =
      'Editar tarjeta de producto';

    edit.append(summary);

    const name = field(
      edit,
      'Nombre',
      product.nombre
    );

    const description = field(
      edit,
      'Descripción',
      product.descripcion,
      'textarea'
    );

    const price = field(
      edit,
      'Precio MXN',
      product.precio,
      'number'
    );

    price.min = '0';
    price.step = '.01';

    const image = field(
      edit,
      'URL HTTPS imagen',
      product.imagen_url,
      'url'
    );

    const video = field(
      edit,
      'URL HTTPS video',
      product.video_url,
      'url'
    );

    // GUARDAR PRODUCTO

    const save =
      document.createElement('button');

    save.type = 'button';
    save.textContent = 'Guardar cambios';

    save.onclick = async () => {
      save.disabled = true;

      try {
        const precio = Number(price.value);

        if (
          !name.value.trim() ||
          !Number.isFinite(precio) ||
          precio < 0
        ) {
          throw Error(
            'Revisa nombre y precio.'
          );
        }

        if (
          (image.value && !safeUrl(image.value)) ||
          (video.value && !safeUrl(video.value))
        ) {
          throw Error(
            'URL multimedia inválida.'
          );
        }

        const res = await db
          .from('productos')
          .update({
            nombre:
              name.value.trim(),
            descripcion:
              description.value.trim(),
            precio,
            imagen_url:
              image.value.trim() || null,
            video_url:
              video.value.trim() || null
          })
          .eq('id', product.id)
          .eq('tienda_id', shop.id)
          .select('id');

        if (res.error) throw res.error;

        if (!res.data?.length) {
          throw Error(
            'No se confirmó la edición.'
          );
        }

        notice(
          'dashMsg',
          'Producto actualizado.',
          true
        );

        await loadProducts();

      } catch (error) {
        notice(
          'dashMsg',
          error.message
        );
      } finally {
        save.disabled = false;
      }
    };

    edit.append(save);
    item.append(edit);

    // ACTIVAR O DESACTIVAR

    const toggle =
      document.createElement('button');

    toggle.type = 'button';
    toggle.className = 'alt';

    toggle.textContent =
      product.activo ? 'Desactivar' : 'Activar';

    toggle.onclick = async () => {
      if (
        !product.activo &&
        Number(product.stock || 0) < 1
      ) {
        notice(
          'dashMsg',
          'Antes de activar necesitas stock disponible.'
        );
        return;
      }

      if (
        !confirm(
          '¿Cambiar el estado de «' +
          product.nombre + '»?'
        )
      ) {
        return;
      }

      toggle.disabled = true;

      try {
        const res = await db
          .from('productos')
          .update({
            activo: !product.activo
          })
          .eq('id', product.id)
          .eq('tienda_id', shop.id)
          .select('id');

        if (res.error) throw res.error;

        if (!res.data?.length) {
          throw Error(
            'No se confirmó el cambio.'
          );
        }

        await loadProducts();

      } catch (error) {
        notice(
          'dashMsg',
          error.message
        );
      } finally {
        toggle.disabled = false;
      }
    };

    // AGREGAR STOCK

    const stockButton =
      document.createElement('button');

    stockButton.type = 'button';
    stockButton.textContent = 'Agregar stock';

    stockButton.onclick = () => {
      selected = product;

      $('stockTitle').textContent =
        'Stock para ' + product.nombre;

      $('stockLines').value = '';

      visible('stockSection', true);

      $('stockSection').scrollIntoView({
        behavior: 'smooth'
      });
    };

    item.append(toggle, stockButton);

    box.append(item);
  }
}

// ======================================
// CANCELAR STOCK
// ======================================

$('cancelStock').onclick = () => {
  visible('stockSection', false);
};

// ======================================
// AGREGAR INVENTARIO DIGITAL
// ======================================

$('addStock').onclick = async () => {
  if (!selected || !shop) return;

  const lines = $('stockLines')
    .value
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (
    lines.length < 1 ||
    lines.length > 100
  ) {
    notice(
      'stockMsg',
      'Ingresa entre 1 y 100 unidades.'
    );
    return;
  }

  setBusy('addStock', true);

  try {
    const res = await db
      .from('inventario_digital')
      .insert(
        lines.map(contenido => ({
          produ
