'use strict';

function getAuthToken() {
  let authTkn = localStorage.getItem('auth-token');
  let tkn = JSON.parse(authTkn ? authTkn : '{}').token;
  return tkn ? tkn : '';
}

function getRefreshToken() {
  let authTkn = localStorage.getItem('auth-token');
  let tkn = JSON.parse(authTkn ? authTkn : '{}').refresh_token;
  return tkn ? tkn : '';
}

function is2faRequired() {
  let authTkn = localStorage.getItem('auth-token');
  let required = JSON.parse(authTkn ? authTkn : '{}').otp_required;
  return required ? required : false;
}

function parseJwt(token) {
  let b64Url = token.split('.')[1];
  let b64 = b64Url.replace(/-/g, '+').replace(/_/g, '/');
  let b = window.atob(b64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join('');
  let d = decodeURIComponent(b);
  return JSON.parse(d);
}

function isJwtExpired(token) {
  if (token === null || token === '') {
    return true;
  }
  let parsed = parseJwt(token);
  return parsed.exp < new Date()/1000
}

async function getOrRefreshAuthToken(loginPath) {
  let tkn = getAuthToken();
  if (tkn === '' || isJwtExpired(tkn)) {
    const rTkn = getRefreshToken();
    if (rTkn === '' || isJwtExpired(rTkn)) {
      window.location = loginPath;
      return;
    }
    await refreshToken(rTkn);
    tkn = getAuthToken();
  }
  return tkn;
}

async function login(name, password) {
  await fetch('/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name:     name,
      password: password
    })
  })
  .then(response => {
    if (response.ok) return response.json();
    else {
      return response.json()
        .then(err => {
          throw new Error(`${err.details} (HTTP ${response.status})`);
        })
    }
  })
  .then(data => {
    localStorage.setItem('auth-token', JSON.stringify(data));
  })
  .catch(err => { throw err; });
}

async function signup(email, password, totp, username) {
  await fetch('/users/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email:        email,
      password:     password,
      totp_enabled: totp,
      username:     username
    })
  })
  .then(response => {
    if (response.ok) return response.json();
    else {
      return response.json()
        .then(err => {
          throw new Error(`${err.details} (HTTP ${response.status})`);
        })
    }
  })
  .then(data => {
    localStorage.setItem('auth-token', JSON.stringify(data));
  })
  .catch(err => { throw err; });
}

async function refreshToken(refreshToken) {
  await fetch('/users/refresh', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${refreshToken}`,
      'Accept': 'application/json'
    }
  })
  .then(response => {
    if (response.ok) return response.json();
    else {
      return response.json()
        .then(err => {
          throw new Error(`${err.details} (HTTP ${response.status})`);
        })
    }
  })
  .then(data => {
    localStorage.setItem('auth-token', JSON.stringify(data));
  })
  .catch(err => { throw err; });
}

async function enableTotp(tkn, enabled) {
  return await fetch('/otp', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tkn}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ enabled: enabled })
  })
  .then(response => {
    if (response.ok) return response.json();
    else {
      return response.json()
        .then(err => {
          throw new Error(`${err.details} (HTTP ${response.status})`);
        })
    }
  })
  .then(data => { return data; })
  .catch(err => { throw err; });
}

async function validateOtp(tkn, otp) {
  await fetch(`otp/validate/${otp}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tkn}`,
      'Accept': 'application/json'
    }
  })
  .then(response => {
    if (response.ok) return response.json();
    else {
      return response.json()
        .then(err => {
          throw new Error(`${err.details} (HTTP ${response.status})`);
        })
    }
  })
  .then(data => {
    localStorage.setItem('auth-token', JSON.stringify(data));
  })
  .catch(err => { throw err; });
}

async function getOtpQrCode(tkn) {
  return await fetch('/otp/qr', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tkn}`,
      'Accept': 'image/png'
    }
  })
  .then(response => {
    if (response.ok) return response.blob();
    else {
      return response.json()
        .then(err => {
          throw new Error(`${err.details} (HTTP ${response.status})`);
        })
    }
  })
  .then(image_blob => {
    return URL.createObjectURL(image_blob);
  })
  .catch(err => { throw err; });
}
