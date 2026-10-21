const SUPABASE_URL = 'https://rsetoudhvhsyrxrbizwu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9sKeYqDz7nKXJlv4_g4KMQ_s9tLXquH';
const FIXED_ADDRESS = '14 rue de la Guyane, Nantes 44200';

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
let currentView = 'grid';

const catLabel = (id) => (CATEGORIES.find(c=>c.id===id)||{}).label || id;
const catIcon = (id) => (CATEGORIES.find(c=>c.id===id)||{}).icon || 'lucide:boxes';

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

function populateFilters(){
  const catSel = document.getElementById('categoryFilter');
  catSel.innerHTML = '<option value="all">Toutes catégories</option>' + CATEGORIES.map(c=>`<option value="${c.id}">${c.label}</option>`).join('');
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
  const last = stock.reduce((a,b)=> { const t = new Date(b.maj).getTime(); return t > a ? t : a; }, 0);
  document.getElementById('lastSync').textContent = last ? `Dernière mise à jour : ${timeAgo(last)}` : '';
  if(window.icons) window.icons.replace();
}

function getFiltered(){
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const cat = document.getElementById('categoryFilter').value;
  const av = document.getElementById('availFilter').value;
  return stock.filter(i=>{
    if(q && !(i.nom.toLowerCase().includes(q) || (i.notes||'').toLowerCase().includes(q))) return false;
    if(cat !== 'all' && i.categorie !== cat) return false;
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
    </div>`).join('');
}

function renderList(items){
  const el = document.getElementById('listView');
  if(items.length === 0){
    el.innerHTML = `<p class="text-center text-stone-400 py-10">Aucun matériau ne correspond à votre recherche.</p>`;
    return;
  }
  el.innerHTML = `
    <table class="w-full text-sm">
      <thead>
        <tr class="text-left text-stone-500 border-b border-stone-200 bg-stone-50">
          <th class="px-4 py-3 font-medium"></th>
          <th class="px-4 py-3 font-medium">Matériau</th>
          <th class="px-4 py-3 font-medium">Catégorie</th>
          <th class="px-4 py-3 font-medium">Quantité</th>
          <th class="px-4 py-3 font-medium">Localisation</th>
          <th class="px-4 py-3 font-medium">Statut</th>
          <th class="px-4 py-3 font-medium">Maj</th>
          <th class="px-4 py-3 font-medium">Fiche</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(i=>`
          <tr class="border-b border-stone-100 hover:bg-stone-50">
            <td class="px-4 py-3">${i.photo_url?`<img src="${i.photo_url}" class="w-10 h-10 object-cover rounded-lg" />`:`<div class="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-300"><i data-icon="lucide:image" data-size="14px"></i></div>`}</td>
            <td class="px-4 py-3 font-medium">${i.nom}</td>
            <td class="px-4 py-3 text-stone-500">${catLabel(i.categorie)}</td>
            <td class="px-4 py-3">${i.quantite} ${i.unite}</td>
            <td class="px-4 py-3 text-stone-500">${i.localisation||'—'}</td>
            <td class="px-4 py-3">${badgeFor(availStatus(i))}</td>
            <td class="px-4 py-3 text-stone-400 text-xs">${timeAgo(i.maj)}</td>
            <td class="px-4 py-3">${i.fiche_url?`<a href="${i.fiche_url}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-xs text-[#1f4d3d] hover:underline"><i data-icon="lucide:file-text" data-size="13px"></i>PDF</a>`:'<span class="text-stone-300 text-xs">—</span>'}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function render(){
  const items = getFiltered();
  document.getElementById('resultCount').textContent = `${items.length} lot(s) affiché(s) sur ${stock.length} au total`;
  renderGrid(items);
  renderList(items);
  renderSummary();
  if(window.icons) window.icons.replace();
}

['searchInput','categoryFilter','availFilter'].forEach(id=>{
  document.getElementById(id).addEventListener('input', render);
  document.getElementById(id).addEventListener('change', render);
});

function setView(view){
  currentView = view;
  document.getElementById('gridView').classList.toggle('hidden', view!=='grid');
  document.getElementById('listView').classList.toggle('hidden', view!=='list');
  document.getElementById('viewGrid').className = `px-3 py-2.5 ${view==='grid' ? 'bg-[#1f4d3d] text-white' : 'bg-white text-stone-600'}`;
  document.getElementById('viewList').className = `px-3 py-2.5 ${view==='list' ? 'bg-[#1f4d3d] text-white' : 'bg-white text-stone-600'}`;
  if(window.icons) window.icons.replace();
}
document.getElementById('viewGrid').addEventListener('click', ()=> setView('grid'));
document.getElementById('viewList').addEventListener('click', ()=> setView('list'));

// --- Copier l'adresse ---
async function copyAddress(){
  try{
    await navigator.clipboard.writeText(FIXED_ADDRESS);
    return true;
  }catch(e){
    try{
      const ta = document.createElement('textarea');
      ta.value = FIXED_ADDRESS;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }catch(e2){
      return false;
    }
  }
}
document.querySelectorAll('.copyAddrBtn').forEach(btn=>{
  const label = btn.querySelector('.copyAddrLabel');
  btn.addEventListener('click', async ()=>{
    const ok = await copyAddress();
    const original = label ? label.textContent : btn.textContent;
    if(label){ label.textContent = ok ? 'Copié !' : 'Erreur'; }
    else { btn.textContent = ok ? 'Copié !' : 'Erreur'; }
    setTimeout(()=>{ if(label){ label.textContent = original; } else { btn.textContent = original; } }, 1800);
  });
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
    connStatus.classList.add('hidden');
    render();
  }catch(e){
    connStatus.textContent = "Erreur réseau lors de la connexion à Supabase : " + (e.message || e);
    connStatus.className = 'text-xs rounded-lg px-3 py-2 bg-red-50 text-red-600';
  }
}

populateFilters();
setView('grid');
loadStock();

if(sb){
  sb.channel('stock-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stock' }, () => {
      loadStock();
    })
    .subscribe();
}
