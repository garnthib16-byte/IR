/* icons.js — version autonome pour déploiement réel (GitHub Pages, etc.)
   Remplace le module généré par l'outil interne de prototypage.
   Va chercher chaque icône (ex: "lucide:map-pin") via l'API publique Iconify
   (https://api.iconify.design) et l'injecte comme image SVG inline.
   Nécessite un accès internet côté visiteur (normal pour un site en ligne). */
(function(){
  function iconUrl(id, size, color){
    var parts = id.split(':');
    var prefix = parts[0];
    var name = parts.slice(1).join(':');
    var params = [];
    if(size) params.push('height=' + encodeURIComponent(size));
    if(color) params.push('color=' + encodeURIComponent(color));
    return 'https://api.iconify.design/' + prefix + '/' + name + '.svg' + (params.length ? ('?' + params.join('&')) : '');
  }

  function applyIcon(el){
    var id = el.getAttribute('data-icon');
    if(!id) return;
    var sizeAttr = el.getAttribute('data-size') || '1em';
    var size = parseInt(sizeAttr, 10) || 16;
    var color = el.getAttribute('data-color') || 'currentColor';
    var img = document.createElement('img');
    img.src = iconUrl(id, size, color);
    img.alt = '';
    img.style.width = sizeAttr.indexOf('px') > -1 ? sizeAttr : size + 'px';
    img.style.height = img.style.width;
    img.style.display = 'inline-block';
    img.style.verticalAlign = 'middle';
    // conserve les classes/attributs utiles posés sur l'élément d'origine
    if(el.className) img.className = el.className;
    el.replaceWith(img);
  }

  function replace(root){
    (root || document).querySelectorAll('[data-icon]').forEach(applyIcon);
  }

  window.icons = {
    replace: replace,
    svg: function(id, opts){
      opts = opts || {};
      var size = opts.size || '1em';
      var color = opts.color || 'currentColor';
      return '<img src="' + iconUrl(id, size, color) + '" alt="" style="width:' + size + ';height:' + size + ';display:inline-block;vertical-align:middle;" />';
    }
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ replace(); });
  } else {
    replace();
  }
})();
