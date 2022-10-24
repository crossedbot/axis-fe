'use strict';

/*************
 * CONSTANTS *
 *************/
const METHOD_DELETE   = 'DELETE';
const METHOD_GET      = 'GET';
const METHOD_PATCH    = 'PATCH';
const METHOD_PUT      = 'PUT';
const METHOD_POST     = 'POST';

const AXIS_LOGIN_PATH   = '/login';
const PINS_PAGE_LIMIT   = 10;
const PINS_PATH_PREFIX  = '/pins';

/*************
 * UTILITIES *
 *************/
function appendKeyValuePairInput(container) {
  let outer = document.getElementById(container);
  let ele = 'div';
  let className = 'grid';
  let attrs = new Map([]);
  let content = '';
  let grid = appendElement(outer, ele, className, attrs, content);

  /* Append key input */
  ele = 'input';
  className = 'form__textbox grid__item';
  attrs = new Map([
    ['type', 'text'],
    ['placeholder', 'key'],
    ['style', 'margin-right:4px;']
  ]);
  appendElement(grid, ele, className, attrs, content);

  /* Append value input */
  attrs = new Map([
    ['type', 'text'],
    ['placeholder', 'value']
  ]);
  appendElement(grid, ele, className, attrs, content);

  /* Append remove input button */
  ele = 'span';
  className = 'close grid__item';
  attrs = new Map([ ['style', 'padding:8px 4px;'] ]);
  content = '&times;';
  let rmBtn = appendElement(grid, ele, className, attrs, content);
  rmBtn.onclick = (rmev) => {
    rmev.preventDefault();
    grid.remove();
  };

  return grid;
}

function appendTextInput(container) {
  let outer = document.getElementById(container);
  let ele = 'div';
  let className = 'grid';
  let attrs = new Map([]);
  let content = '';
  let grid = appendElement(outer, ele, className, attrs, content);

  /* Append text input */
  ele = 'input';
  className = 'form__textbox grid__item';
  attrs = new Map([ ['type', 'text'] ]);
  appendElement(grid, ele, className, attrs, content);

  /* Append remove input button */
  ele = 'span';
  className = 'close grid__item';
  attrs = new Map([ ['style', 'padding:8px 4px;'] ]);
  content = '&times;';
  let rmBtn = appendElement(grid, ele, className, attrs, content);
  rmBtn.onclick = (rmev) => {
    rmev.preventDefault();
    grid.remove();
  };

  return grid;
}

function getCreatePinFormOrigins() {
  let createPinOriginsDiv = document.getElementById('createPinOriginsDiv');
  let originsInputs = createPinOriginsDiv.querySelectorAll('.grid input');
  let origins = new Array();
  for (let i = 0; i < originsInputs.length; i++) {
    let origin = originsInputs[i].value;
    if (origin !== '') {
      origins.push(origin);
    }
  }
  return origins;
}

function getCreatePinFormMetaInfo() {
  let createPinMetaInfoDiv = document.getElementById('createPinMetaInfoDiv');
  let metaInfoInputs = createPinMetaInfoDiv.querySelectorAll('.grid input');
  let metaInfo = new Map();
  for (let i = 0; i < metaInfoInputs.length; i += 2) {
    let key = metaInfoInputs[i].value;
    let value = metaInfoInputs[i+1].value;
    if (key !== '' && value !== '') {
      metaInfo.set(key, value);
    }
  }
  return metaInfo;
}

/************
 * HANDLERS *
 ************/
function onCloseCreatePinModal(ev) {
  let createPinAlertDiv = document.getElementById('createPinAlertDiv');
  createPinAlertDiv.innerHTML = '';

  let createPinForm = document.getElementById('createPinForm');
  createPinForm.createPinCid.value = '';
  createPinForm.createPinName.value = '';

  let createPinOriginsDiv = document.getElementById('createPinOriginsDiv');
  let origins = createPinOriginsDiv.querySelectorAll('.grid');
  for (let i = 0; i < origins.length; i++) {
    origins[i].remove();
  }

  let createPinMetaInfoDiv = document.getElementById('createPinMetaInfoDiv');
  let metaInfo = createPinMetaInfoDiv.querySelectorAll('.grid');
  for (let i = 0; i < metaInfo.length; i++) {
    metaInfo[i].remove();
  }
}

function onPageSelection(ev) {
      ev.preventDefault();
      let source = ev.target || ev.srcElement;
      let page = source.getAttribute('page');
      if (page <= 0) { page = 1 }
      const filters = new Map([
        ['limit', PINS_PAGE_LIMIT],
        ['offset', (page-1)*PINS_PAGE_LIMIT]
      ]);
      populatePinsTable('pinsTableDiv', 'pinsTableAlertDiv', filters);
}

function onSubmitCreatePin(ev) {
  ev.preventDefault();

  /* Parse the form data */
  let createPinForm = ev.target || ev.srcElement;
  let data = new Object();
  let cid = createPinForm.createPinCid.value;
  if (cid === '') {
    displayAlert('danger', 'CID is required.', 'createPinAlertDiv');
    return;
  }
  data.cid = cid;
  let name = createPinForm.createPinName.value;
  if (name !== '') {
    data.name = name;
  }
  let origins = getCreatePinFormOrigins();
  if (origins.length > 0) {
    data.origins = origins;
  }
  let metaInfo = getCreatePinFormMetaInfo();
  if (metaInfo.size > 0) {
    data.meta = Object.fromEntries(metaInfo);
  }

  /* Create pin and refresh the pins table */
  getOrRefreshAuthToken(AXIS_LOGIN_PATH)
    .then(tkn => { return createPin(tkn, data) })
    .then(data => {
      let filters = new Map([['limit', PINS_PAGE_LIMIT]]);
      populatePinsTable('pinsTableDiv', 'pinsTableAlertDiv', filters);
    })
    .catch(err => { displayAlert('danger', err, 'createPinAlertDiv'); });
}

function handleCreatePinModal() {
  /* Handle origins inputs */
  let originBtn = document.getElementById('newOriginInputBtn');
  originBtn.onclick = (ev) => {
    ev.preventDefault();
    appendTextInput('createPinOriginsDiv');
  }

  /* Handle meta-info inputs */
  let metaInfoBtn = document.getElementById('newMetaInfoBtn');
  metaInfoBtn.onclick = (ev) => {
    ev.preventDefault();
    appendKeyValuePairInput('createPinMetaInfoDiv');
  }

  /* Handle form submit */
  let createPinForm = document.getElementById('createPinForm');
  createPinForm.addEventListener('submit', onSubmitCreatePin);

  /* Handle the modal */
  let modal = document.getElementById('createPinModal');
  let btn = document.getElementById('openCreatePinModalBtn');
  let span = document.getElementById('closeCreatePinModalBtn');
  handleModal(modal, btn, span);
  appendOnClick(span, onCloseCreatePinModal);
  appendOnClick(window, function(event) {
    if (event.target == modal) {
      onCloseCreatePinModal(event);
    }
  });
}

function handleGetPinModal() {
  const pinIds= document.querySelectorAll('.pinid');
  let closeBtn = document.getElementById('closePinStatusModalBtn');
  let modal = document.getElementById('pinStatusModal');
  pinIds.forEach((pinId) => {
    pinId.onclick = async (ev) => {
      ev.preventDefault();
      let source = ev.target || ev.srcElement;
      let id = source.innerText;
      modal.style.display = 'flex';
      populatePinStatusDetails('pinStatusDetailsDiv', 'pinStatusAlertDiv', id);
    };
  });
  closeBtn.onclick = (ev) => {
    ev.preventDefault();
    modal.style.display = 'none';
  };
  appendOnClick(window, (ev) => {
    if (ev.target === modal) {
      modal.style.display = 'none';
    }
  });
}

function handleUserProfileModal() {
  let modal = document.getElementById('userProfileModal');
  let btn = document.getElementById('openUserProfileModalBtn');
  let span = document.getElementById('closeUserProfileModalBtn');
  handleModal(modal, btn, span);
}

function handleLogout() {
  let btn = document.getElementById('logoutBtn');
  btn.onclick = (ev) => {
    ev.preventDefault();
    localStorage.removeItem('auth-token');
    window.location.reload();
  }
}

function handleSortPinsTable() {
  let dropdown = document.getElementById('pinsSortDropdown');
  let items = dropdown.querySelectorAll('.dropdown__menu .dropdown__item');
  items.forEach((item) => {
    item.onclick = async (ev) => {
      ev.preventDefault();
      let source = ev.target || ev.srcElement;
      let sortBy = source.name;
      const filters = new Map([
        ['limit', PINS_PAGE_LIMIT],
        ['sort', sortBy],
      ]);
      populatePinsTable('pinsTableDiv', 'pinsTableAlertDiv', filters);
    };
  });
}

function handlePageSelection() {
  let container = document.getElementById('paginationDiv');
  let prev = container.querySelector('.paginate__container .paginate__previous');
  let next = container.querySelector('.paginate__container .paginate__next');
  let items = container.querySelectorAll('.paginate__container .paginate__index');
  if (!prev.classList.contains('paginate--disabled')) {
    prev.onclick = onPageSelection;
  }
  if (!next.classList.contains('paginate--disabled')) {
    next.onclick = onPageSelection;
  }
  items.forEach((item) => {
    item.onclick = onPageSelection;
  });
}

function handleNavigationBar() {
  let token = getAuthToken();
  if (token !== '') {
    let claims = parseJwt(token);
    let name = claims.username ? claims.username : claims.email ? claims.email : '';
    if (name === '') {
      name = 'Unknown User';
    }
    let userNavOptions = document.getElementById('userNavOptionsDiv');
    let userNavName = document.getElementById('userNavNameBtn');
    userNavOptions.style.display = 'flex';
    userNavName.innerHTML = name;
    handleLogout();
  }
}

/*********
 * HOOKS *
 *********/
function sendPinsRequest(method, headers, url, data) {
  let options = { method: method, headers: headers }
  if (data !== null && data !== {}) { options.body = JSON.stringify(data); }
  return fetch(url, options)
    .then(response => {
      if (response.ok) {
        return response.text();
      }
      return response.text().then(err => { throw new Error(err) });
    })
    .then(html => {
      let parser = new DOMParser();
      let doc = parser.parseFromString(html, 'text/html');
      return doc;
    });
}

function createPin(token, pin) {
  let method = METHOD_POST;
  let url = PINS_PATH_PREFIX;
  let headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'text/html'
  };
  return sendPinsRequest(method, headers, url, pin);
}

function getPin(token, requestId) {
  let method = METHOD_GET;
  let url = `${PINS_PATH_PREFIX}/${requestId}`;
  let headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'text/html'
  };
  return sendPinsRequest(method, headers, url, null);
}

function listPins(token, filters) {
  const params = new URLSearchParams(filters);
  let method = METHOD_GET;
  let url = `${PINS_PATH_PREFIX}?${params.toString()}`;
  let headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'text/html'
  };
  return sendPinsRequest(method, headers, url, null);
}

function patchPin(token, requestId, pin) {
  let method = METHOD_PATCH;
  let url = `${PINS_PATH_PREFIX}/${requestId}`;
  let headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'text/html'
  };
  return sendPinsRequest(method, headers, url, pin);
}

function removePin(token, requestId) {
  let method = METHOD_GET;
  let url = `${PINS_PATH_PREFIX}/${requestId}`;
  let headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'text/html'
  };
  return sendPinsRequest(method, headers, url, null);
}

async function populatePinStatusDetails(container, alerts, requestId) {
  let outer = document.getElementById(container);
  outer.innerHTML = '';
  document.getElementById(alerts).innerHTML = '';
  getOrRefreshAuthToken(AXIS_LOGIN_PATH)
    .then(tkn => { return getPin(tkn, requestId); })
    .then(html => { appendHTMLDoc(outer, html); })
    .catch(err => { displayAlert('danger', err, alerts); });
}

async function populatePinsTable(container, alerts, filters) {
  let outer = document.getElementById(container);
  outer.innerHTML = '';
  document.getElementById(alerts).innerHTML = '';
  getOrRefreshAuthToken(AXIS_LOGIN_PATH)
    .then(tkn => { return listPins(tkn, filters); })
    .then(html => {
      appendHTMLDoc(outer, html);
      handleNavigationBar();
      handleCreatePinModal();
      handleGetPinModal();
      handleSortPinsTable();
      handlePageSelection();
    })
    .catch(err => { displayAlert('danger', err, alerts); });
}
