(() => {
  const photos = Array.isArray(window.MSIBA_PHOTOS) ? window.MSIBA_PHOTOS : [];
  const grid = document.getElementById('photo-grid');
  const search = document.getElementById('photo-search');
  const status = document.getElementById('gallery-status');
  const total = document.getElementById('total-count');
  const empty = document.getElementById('gallery-empty');
  const more = document.getElementById('load-more');
  const filters = [...document.querySelectorAll('.filter-button')];
  const perPage = 48;
  const ranges = {
    all: () => true,
    gathering: (photo) => photo.number <= 7755,
    tribute: (photo) => photo.number > 7755 && photo.number < 8559,
    farewell: (photo) => photo.number >= 8559,
  };
  let currentFilter = 'all';
  let visibleCount = perPage;
  let matches = [];
  let activePhotoIndex = -1;

  const dialog = document.createElement('dialog');
  dialog.className = 'photo-dialog';
  dialog.setAttribute('aria-label', 'Picha ya kumbukumbu');
  dialog.innerHTML = `
    <div class="photo-dialog__bar">
      <p class="photo-dialog__caption"><span id="dialog-name"></span><span id="dialog-count"></span></p>
      <div class="photo-dialog__tools">
        <a class="photo-dialog__download" id="dialog-download" href="#" download>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" /></svg>
          Pakua picha
        </a>
        <button class="photo-dialog__close" id="dialog-close" type="button" aria-label="Funga picha" autofocus>×</button>
      </div>
    </div>
    <div class="photo-dialog__stage">
      <button class="photo-dialog__arrow photo-dialog__arrow--prev" id="dialog-prev" type="button" aria-label="Picha iliyotangulia">‹</button>
      <img id="dialog-image" alt="" />
      <button class="photo-dialog__arrow photo-dialog__arrow--next" id="dialog-next" type="button" aria-label="Picha inayofuata">›</button>
    </div>`;
  document.body.append(dialog);

  const dialogImage = document.getElementById('dialog-image');
  const dialogName = document.getElementById('dialog-name');
  const dialogCount = document.getElementById('dialog-count');
  const dialogDownload = document.getElementById('dialog-download');

  function makeIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" />';
    return svg;
  }

  function createCard(photo) {
    const article = document.createElement('article');
    article.className = 'photo-card';

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'photo-card__open';
    open.setAttribute('aria-label', `Fungua picha ${photo.name}`);
    open.addEventListener('click', () => openPhoto(photo));

    const image = document.createElement('img');
    image.src = photo.thumb;
    image.alt = `Picha ya kumbukumbu ${photo.name}`;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => article.classList.add('photo-card--broken'), { once: true });
    open.append(image);

    const name = document.createElement('span');
    name.className = 'photo-card__name';
    name.textContent = photo.name;
    open.append(name);

    const download = document.createElement('a');
    download.className = 'photo-card__download';
    download.href = photo.src;
    download.download = photo.name;
    download.setAttribute('aria-label', `Pakua ${photo.name}`);
    download.title = 'Pakua picha asili';
    download.append(makeIcon());
    article.append(open, download);
    return article;
  }

  function activePhotos() {
    const phrase = search.value.trim().toLocaleLowerCase();
    return photos.filter((photo) => ranges[currentFilter](photo) && (!phrase || photo.name.toLocaleLowerCase().includes(phrase)));
  }

  function render(reset = false) {
    if (reset) visibleCount = perPage;
    matches = activePhotos();
    const fragment = document.createDocumentFragment();
    matches.slice(0, visibleCount).forEach((photo) => fragment.append(createCard(photo)));
    grid.replaceChildren(fragment);
    total.textContent = new Intl.NumberFormat('sw-TZ').format(photos.length);
    status.textContent = matches.length
      ? `Picha ${new Intl.NumberFormat('sw-TZ').format(Math.min(visibleCount, matches.length))} kati ya ${new Intl.NumberFormat('sw-TZ').format(matches.length)} zinaonekana. Pakua picha moja moja.`
      : '';
    empty.hidden = matches.length !== 0;
    more.hidden = matches.length <= visibleCount;
    if (!matches.length) grid.replaceChildren();
  }

  function openPhoto(photo) {
    activePhotoIndex = matches.indexOf(photo);
    if (activePhotoIndex < 0) activePhotoIndex = photos.indexOf(photo);
    showPhoto(photo);
    if (!dialog.open) dialog.showModal();
  }

  function showPhoto(photo) {
    const index = matches.indexOf(photo);
    activePhotoIndex = index >= 0 ? index : photos.indexOf(photo);
    dialogImage.src = photo.src;
    dialogImage.alt = `Picha ya kumbukumbu ${photo.name}`;
    dialogName.textContent = photo.name;
    dialogCount.textContent = `${new Intl.NumberFormat('sw-TZ').format(activePhotoIndex + 1)} / ${new Intl.NumberFormat('sw-TZ').format(matches.length || photos.length)}`;
    dialogDownload.href = photo.src;
    dialogDownload.download = photo.name;
  }

  function changePhoto(direction) {
    const list = matches.length ? matches : photos;
    if (!list.length) return;
    activePhotoIndex = (activePhotoIndex + direction + list.length) % list.length;
    showPhoto(list[activePhotoIndex]);
  }

  filters.forEach((button) => button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    filters.forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    render(true);
  }));
  search.addEventListener('input', () => render(true));
  more.addEventListener('click', () => {
    visibleCount += perPage;
    render();
  });
  document.getElementById('dialog-close').addEventListener('click', () => dialog.close());
  document.getElementById('dialog-prev').addEventListener('click', () => changePhoto(-1));
  document.getElementById('dialog-next').addEventListener('click', () => changePhoto(1));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') changePhoto(1);
    if (event.key === 'ArrowLeft') changePhoto(-1);
  });

  document.querySelectorAll('[data-chapter-link]').forEach((link) => link.addEventListener('click', () => {
    const filter = link.dataset.chapterLink;
    const filterButton = filters.find((button) => button.dataset.filter === filter);
    filterButton?.click();
  }));
  document.querySelectorAll('[data-story-photo]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    const photo = photos.find((entry) => entry.name === link.dataset.storyPhoto);
    if (photo) {
      if (!matches.includes(photo)) {
        currentFilter = 'all';
        search.value = '';
        filters.find((button) => button.dataset.filter === 'all')?.click();
      }
      openPhoto(photo);
    }
  }));
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && !dialog.open && document.activeElement !== search) {
      event.preventDefault();
      search.focus();
    }
  });

  if (photos.length) render(true);
  else {
    grid.replaceChildren();
    status.textContent = 'Picha hazijapakiwa. Angalia kuwa faili la photos.js lipo pamoja na ukurasa huu.';
    empty.hidden = false;
  }
})();
