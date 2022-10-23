'use strict';

window.onload = () => {
  let loadTime = window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart;
  console.log('Page load time: ' + loadTime / 1000 + ' ms');
}

function docReady(fn) {
  let readyState = document.readyState;
  if (readyState === 'complete' || readyState === 'interactive') {
    setTimeout(fn, 1);
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

function handleModal(modal, openBtn, closeBtn) {
  openBtn.onclick = function() {
    modal.style.display = 'flex';
  }
  closeBtn.onclick = function() {
    modal.style.display = 'none';
  }
  appendOnClick(window, function(event) {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  });
}

function appendElement(outer, ele, className, attrs, content) {
  let child = document.createElement(ele);
  child.className = className;
  for (let attr of attrs.entries()) {
    let key = attr[0];
    let val = attr[1];
    child.setAttribute(key, val);
  }
  child.innerHTML = content;
  outer.appendChild(child);
  return child;
}

function appendHTMLDoc(outer, html) {
  let child = html.querySelector('body').childNodes[0];
  outer.appendChild(document.importNode(child, true));
}

function appendOnClick(ele, fn) {
  let current = ele.onclick;
  ele.onclick = function(event) {
    if (current) {
      current(event);
    }
    fn(event);
  }
}

function displayAlert(type, msg, parentId) {
  let alert = document.createElement('div');
  type = type.toLowerCase();
  alert.innerHTML = msg;
  alert.classList.add('alert');
  switch (type) {
    case 'info':
    case 'danger':
    case 'success':
    case 'warning':
      alert.classList.add(`alert--${type}`);
      break;
  }
  alert.setAttribute('style', 'margin-bottom:12px;');
  let parent = document.getElementById(parentId);
  for(;parent.firstChild !== null;) {
    parent.removeChild(parent.firstChild);
  }
  parent.appendChild(alert);
}
