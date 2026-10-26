const SUPABASE_URL = 'https://rsetoudhvhsyrxrbizwu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9sKeYqDz7nKXJlv4_g4KMQ_s9tLXquH';
const FIXED_ADDRESS = '14 rue de la Guyane, Nantes 44200';

// --- Formulaire de commande (envoi par mail via Web3Forms) ---
// Remplacez cette valeur par la clé d'accès reçue par mail sur https://web3forms.com
const WEB3FORMS_ACCESS_KEY = 'd06efd80-06bb-45db-8e84-81ef6a409b3f';
const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

let sb = null;
let supabaseLoadError = null;
try{
  if(!window.supabase || typeof window.supabase.createClient !== 'function'){
    throw new Error("La librairie Supabase n'a pas pu se charger.");
  }
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}catch(e){
  supabaseLoadError = e.message || String(e);
}

let stock = [];

const findCat = (id) => CATEGORIES.find(c => String(c.id).toLowerCase() === String(id ?? '').trim().toLowerCase());
const prettyCat = (id) => {
  const known = findCat(id);
  if(known) return known.label;
  const s = String(id ?? '').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Autre';
};
const catLabel = prettyCat;
const catIcon = (id) => (findCat(id) || {}).icon || 'lucide:boxes';

function availStatus(item){
  return Number(item.quantite) > 0 ? 'yes' : 'no';
}

function timeAgo(ts){
  if(!ts) return '—';
  const diff = Math.floor((Date.now() - new Date(ts).getTime())/60000);
  if(diff < 1) return "à l'instant";
  if(diff < 60) return `il y a ${diff} min`;
  const h = Math.floor(diff/60);
  if(h < 24) return `il y a ${h} h`;
  const d = Math.floor(h/24);
  return `il y a ${d} j`;
}

// Le filtre se construit à partir des catégories réellement présentes dans la colonne "categorie" de Supabase
function populateFilters(){
  const catSel = document.getElementById('categoryFilter');
  const previous = catSel.value || 'all';
  const cats = [...new Set(
    stock.map(i => i.categorie).filter(c => c !== null && c !== undefined && String(c).trim() !== '')
  )].sort((a,b) => prettyCat(a).localeCompare(prettyCat(b), 'fr'));
  catSel.innerHTML = '';
  catSel.add(new Option('Toutes catégories', 'all'));
  cats.forEach(c => catSel.add(new Option(prettyCat(c), c)));
  catSel.value = cats.map(String).includes(previous) ? previous : 'all';
}

function renderSummary(){
  const total = stock.length;
  const dispo = stock.filter(i=>availStatus(i)==='yes').length;
  const indispo = stock.filter(i=>availStatus(i)==='no').length;
  const totalTonnes = stock.reduce((a,b)=> a + (Number(b.quantite)||0), 0);
  const cards = [
    { label: 'Matériaux référencés', value: total, icon: 'lucide:boxes', color: '#1f4d3d' },
    { label: 'Disponibles', value: dispo, icon: 'lucide:check-circle-2', color: '#1f4d3d' },
    { label: 'Indisponibles', value: indispo, icon: 'lucide:x', color: '#b91c1c' },
    { label: 'Tonnage total', value: `${totalTonnes} t`, icon: 'lucide:mountain', color: '#1f4d3d' },
  ];
  document.getElementById('summaryCards').innerHTML = cards.map(c=>`
    <div class="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:${c.color}1a;color:${c.color}">
        <i data-icon="${c.icon}" data-size="18px"></i>
      </div>
      <div>
        <p class="text-xl font-bold leading-tight">${c.value}</p>
        <p class="text-xs text-stone-500 leading-tight">${c.label}</p>
      </div>
    </div>`).join('');
  if(window.icons) window.icons.replace();
}

function getFiltered(){
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const cat = document.getElementById('categoryFilter').value;
  const av = document.getElementById('availFilter').value;
  return stock.filter(i=>{
    if(q && !(i.nom.toLowerCase().includes(q) || (i.notes||'').toLowerCase().includes(q))) return false;
    if(cat !== 'all' && String(i.categorie) !== cat) return false;
    if(av !== 'all' && availStatus(i) !== av) return false;
    return true;
  }).sort((a,b)=> (a.nom||'').localeCompare(b.nom||''));
}

function badgeFor(status){
  if(status==='yes') return `<span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700"><i data-icon="lucide:check-circle-2" data-size="12px"></i>Disponible</span>`;
  return `<span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700"><i data-icon="lucide:x" data-size="12px"></i>Indisponible</span>`;
}

function renderGrid(items){
  const el = document.getElementById('gridView');
  if(items.length === 0){
    el.innerHTML = `<p class="col-span-full text-center text-stone-400 py-10">Aucun matériau ne correspond à votre recherche.</p>`;
    return;
  }
  el.innerHTML = items.map(i=>`
    <div class="card-hover bg-white rounded-2xl border border-stone-200 shadow-sm p-4 flex flex-col gap-3">
      ${i.photo_url ? `<img src="${i.photo_url}" class="w-full h-32 object-cover rounded-xl" />` : `<div class="w-full h-20 rounded-xl bg-stone-100 flex items-center justify-center text-stone-300"><i data-icon="lucide:image" data-size="22px"></i></div>`}
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-2">
          <div class="w-9 h-9 rounded-lg bg-[#1f4d3d]/10 text-[#1f4d3d] flex items-center justify-center shrink-0">
            <i data-icon="${catIcon(i.categorie)}" data-size="16px"></i>
          </div>
          <div>
            <p class="font-semibold text-sm leading-tight">${i.nom}</p>
            <p class="text-xs text-stone-500">${catLabel(i.categorie)}</p>
          </div>
        </div>
        ${badgeFor(availStatus(i))}
      </div>
      <div class="flex items-baseline gap-1">
        <span class="text-2xl font-bold text-[#1f4d3d]">${i.quantite}</span>
        <span class="text-xs text-stone-500">${i.unite}</span>
      </div>
      <div class="text-xs text-stone-500 space-y-1">
        <p class="flex items-center gap-1.5"><i data-icon="lucide:map-pin" data-size="13px"></i>${i.localisation||'—'}</p>
        <p class="flex items-center gap-1.5"><i data-icon="lucide:clock" data-size="13px"></i>Mis à jour ${timeAgo(i.maj)}</p>
      </div>
      ${i.notes?`<p class="text-xs text-stone-400 border-t border-stone-100 pt-2">${i.notes}</p>`:''}
      ${i.fiche_url ? `<a href="${i.fiche_url}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-xs font-medium text-[#1f4d3d] hover:underline"><i data-icon="lucide:file-text" data-size="13px"></i>${i.fiche_nom || 'Fiche technique (PDF)'}</a>` : ''}
      <button type="button" class="orderBtn mt-auto flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl text-white hover:brightness-110" style="background:#1f4d3d" data-id="${i.id}"><i data-icon="lucide:shopping-cart" data-size="16px" data-color="#ffffff"></i>Demande de devis</button>
    </div>`).join('');
}

function render(){
  const items = getFiltered();
  document.getElementById('resultCount').textContent = `${items.length} lot(s) affiché(s) sur ${stock.length} au total`;
  renderGrid(items);
  renderSummary();
  if(window.icons) window.icons.replace();
}

['searchInput','categoryFilter','availFilter'].forEach(id=>{
  document.getElementById(id).addEventListener('input', render);
  document.getElementById(id).addEventListener('change', render);
});

// --- Connexion Supabase : chargement initial + temps réel ---
const connStatus = document.getElementById('connStatus');

async function loadStock(){
  if(supabaseLoadError){
    connStatus.textContent = supabaseLoadError;
    connStatus.className = 'text-xs rounded-lg px-3 py-2 bg-amber-50 text-amber-700';
    return;
  }
  try{
    const { data, error } = await sb.from('stock').select('*');
    if(error){
      connStatus.textContent = "Connexion à la base impossible : " + error.message;
      connStatus.className = 'text-xs rounded-lg px-3 py-2 bg-red-50 text-red-600';
      return;
    }
    stock = data || [];
    connStatus.style.display = 'none';
    populateFilters();
    render();
  }catch(e){
    connStatus.textContent = "Erreur réseau lors de la connexion à Supabase : " + (e.message || e);
    connStatus.className = 'text-xs rounded-lg px-3 py-2 bg-red-50 text-red-600';
  }
}

// --- Fenêtre de commande ---
const showEl = (el, display) => { el.style.display = display || 'block'; };
const hideEl = (el) => { el.style.display = 'none'; };

const orderOverlay = document.getElementById('orderOverlay');
const orderFormWrap = document.getElementById('orderFormWrap');
const orderSuccess = document.getElementById('orderSuccess');
const orderError = document.getElementById('orderError');
let orderItem = null;

function openOrder(item){
  orderItem = item;
  document.getElementById('orderForm').reset();
  document.getElementById('orderMaterial').textContent = `${item.nom} — ${item.quantite} ${item.unite} disponibles`;
  hideEl(orderError);
  hideEl(orderSuccess);
  showEl(orderFormWrap);
  showEl(orderOverlay, 'flex');
  if(window.icons) window.icons.replace();
}
function closeOrder(){ hideEl(orderOverlay); }

document.getElementById('gridView').addEventListener('click', (e)=>{
  const btn = e.target.closest('.orderBtn');
  if(!btn) return;
  const item = stock.find(i => String(i.id) === btn.dataset.id);
  if(item) openOrder(item);
});
document.getElementById('orderClose').addEventListener('click', closeOrder);
document.getElementById('orderCancel').addEventListener('click', closeOrder);
document.getElementById('orderDone').addEventListener('click', closeOrder);
orderOverlay.addEventListener('click', (e)=>{ if(e.target === orderOverlay) closeOrder(); });

async function sendOrder(){
  const form = document.getElementById('orderForm');
  const showErr = (m) => { orderError.textContent = m; showEl(orderError); };
  hideEl(orderError);
  if(!form.reportValidity()) return;
  if(document.getElementById('o_botcheck').checked) return;
  if(!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY.startsWith('REMPLACER')){
    showErr("Le formulaire n'est pas encore configuré (clé d'envoi manquante).");
    return;
  }
  const btn = document.getElementById('orderSend');
  const label = btn.querySelector('span');
  btn.disabled = true;
  label.textContent = 'Envoi en cours...';
  const val = (id) => document.getElementById(id).value.trim();
  const payload = {
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: `Demande de commande – ${orderItem.nom} (${val('o_quantite')} t)`,
    from_name: 'Île Recycle – site matériaux',
    name: val('o_nom'),
    email: val('o_email'),
    'Matériau': orderItem.nom,
    'Quantité demandée (tonnes)': val('o_quantite'),
    'Société / chantier': val('o_societe') || 'Non renseigné',
    'Téléphone': val('o_tel'),
    'Message': val('o_message') || '—'
  };
  try{
    const res = await fetch(WEB3FORMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if(res.ok && data.success){
      hideEl(orderFormWrap);
      showEl(orderSuccess);
      if(window.icons) window.icons.replace();
    } else {
      showErr(data.message || "L'envoi a échoué. Merci de réessayer.");
    }
  }catch(e){
    showErr("Impossible d'envoyer la demande. Vérifiez votre connexion et réessayez, ou contactez-nous par téléphone.");
  }finally{
    btn.disabled = false;
    label.textContent = 'Envoyer ma demande';
  }
}
document.getElementById('orderSend').addEventListener('click', sendOrder);
document.getElementById('orderForm').addEventListener('submit', (e)=>{ e.preventDefault(); sendOrder(); });

populateFilters();
loadStock();

if(sb){
  sb.channel('stock-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stock' }, () => {
      loadStock();
    })
    .subscribe();
}
