const hierarchy = [];
let el = document.querySelector('canvas').parentElement;
while(el && el.tagName !== 'BODY') {
  hierarchy.push({tag: el.tagName, className: el.className, height: el.offsetHeight, clientHeight: el.clientHeight, flex: getComputedStyle(el).flex });
  el = el.parentElement;
}
console.log(JSON.stringify(hierarchy, null, 2));
