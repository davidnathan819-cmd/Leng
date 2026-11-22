'use strict';

const STORAGE_KEY = 'glambook_data_v1';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'glam123';
const DEFAULT_SERVICES = [
  {id:'svc-haircut',name:'Haircut & Styling',price:350,duration:45,description:'A fresh cut and polished style for your look.'},
  {id:'svc-color',name:'Hair Coloring',price:1500,duration:120,description:'Refresh your look with a beautiful new color.'},
  {id:'svc-manicure',name:'Manicure & Pedicure',price:500,duration:60,description:'A relaxing nail care and grooming session.'},
  {id:'svc-facial',name:'Basic Facial',price:700,duration:60,description:'A refreshing facial care experience.'},
  {id:'svc-treatment',name:'Hair Treatment',price:900,duration:90,description:'Give your hair extra care and nourishment.'},
  {id:'svc-makeup',name:'Makeup Service',price:1200,duration:90,description:'A polished makeup look for your special day.'}
];
const TIME_SLOTS = ['09:00','10:00','11:00','13:00','14:00','15:00','16:00'];
let state = loadState();
let isAdmin = false;
let toastTimer;

const $ = id => document.getElementById(id);
const money = value => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(Number(value)||0);
const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); };
const uid = prefix => prefix + '-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,6).toUpperCase();

function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {services:DEFAULT_SERVICES,bookings:[]};
    const parsed = JSON.parse(raw);
    return {services:Array.isArray(parsed.services)?parsed.services:DEFAULT_SERVICES,bookings:Array.isArray(parsed.bookings)?parsed.bookings:[]};
  } catch(error) {
    console.warn('Saved GlamBook data could not be read. Starting with default data.',error);
    return {services:DEFAULT_SERVICES,bookings:[]};
  }
}
function saveState(){
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); return true; }
  catch(error){ console.error(error); showToast('Unable to save. Browser storage may be full or disabled.'); return false; }
}
function showToast(message){
  const toast=$('toast'); toast.textContent=message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),3000);
}
function navigate(view){
  document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
  const target=$(view+'View'); if(target) target.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(el=>el.classList.toggle('active',el.dataset.view===view));
  $('mainNav').classList.remove('open'); $('menuToggle').setAttribute('aria-expanded','false');
  window.scrollTo({top:0,behavior:'smooth'});
  if(view==='records') renderRecords();
  if(view==='admin') renderAdmin();
}
document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>navigate(btn.dataset.view)));
document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>navigate(btn.dataset.go)));
$('menuToggle').addEventListener('click',()=>{const open=$('mainNav').classList.toggle('open');$('menuToggle').setAttribute('aria-expanded',String(open));});
$('year').textContent=new Date().getFullYear();

function renderHomeServices(){
  $('homeServices').innerHTML=state.services.slice(0,3).map((s,i)=>`<article class="service-card"><div class="service-icon">${['✦','♡','✿'][i%3]}</div><h3>${safe(s.name)}</h3><p>${safe(s.description)}</p><div class="service-meta"><span>${money(s.price)}</span><span>${Number(s.duration)} min</span></div></article>`).join('') || '<p class="muted">No services available right now.</p>';
}
function populateServiceSelect(){
  const select=$('serviceSelect'), previous=select.value;
  select.innerHTML='<option value="">Select a service</option>'+state.services.map(s=>`<option value="${safe(s.id)}">${safe(s.name)} — ${money(s.price)}</option>`).join('');
  if(state.services.some(s=>s.id===previous)) select.value=previous;
}
function availableSlots(date,excludeId=''){
  if(!date) return [];
  const now=new Date();
  return TIME_SLOTS.filter(slot=>{
    const [h,m]=slot.split(':').map(Number);
    const chosen=new Date(date+'T00:00:00'); chosen.setHours(h,m,0,0);
    if(chosen<now) return false;
    return !state.bookings.some(b=>b.id!==excludeId && b.date===date && b.time===slot && b.status!=='Cancelled');
  });
}
function populateTimeSelect(excludeId=''){
  const date=$('appointmentDate').value, select=$('timeSelect'), previous=select.value;
  const slots=availableSlots(date,excludeId);
  select.innerHTML=slots.length?'<option value="">Choose a time</option>'+slots.map(t=>`<option value="${t}">${formatTime(t)}</option>`).join(''):'<option value="">No available slots</option>';
  if(slots.includes(previous)) select.value=previous;
  updateSummary();
}
function formatTime(time){const [h,m]=time.split(':').map(Number);return new Date(2000,0,1,h,m).toLocaleTimeString('en-PH',{hour:'numeric',minute:'2-digit'});}
function formatDate(date){if(!date)return '—';return new Date(date+'T00:00:00').toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'});}
function serviceById(id){return state.services.find(s=>s.id===id);}
function updateSummary(){
  const service=serviceById($('serviceSelect').value), date=$('appointmentDate').value, time=$('timeSelect').value;
  $('liveSummary').innerHTML=service?`<div class="summary-line"><span>Service</span><strong>${safe(service.name)}</strong></div><div class="summary-line"><span>Price</span><strong>${money(service.price)}</strong></div><div class="summary-line"><span>Duration</span><strong>${Number(service.duration)} minutes</strong></div><div class="summary-line"><span>Date</span><strong>${formatDate(date)}</strong></div><div class="summary-line"><span>Time</span><strong>${time?formatTime(time):'Not selected'}</strong></div>`:'<p class="muted">Choose a service and date to preview your appointment.</p>';
}
$('serviceSelect').addEventListener('change',updateSummary);
$('appointmentDate').min=todayISO();
$('appointmentDate').addEventListener('change',()=>populateTimeSelect());
$('timeSelect').addEventListener('change',updateSummary);
$('resetBooking').addEventListener('click',()=>setTimeout(()=>{ $('appointmentDate').min=todayISO(); populateTimeSelect(); updateSummary(); },0));

$('bookingForm').addEventListener('submit',event=>{
  event.preventDefault();
  const name=$('customerName').value.trim(), phone=$('customerPhone').value.trim(), email=$('customerEmail').value.trim();
  const service=serviceById($('serviceSelect').value), date=$('appointmentDate').value, time=$('timeSelect').value;
  if(!name||!phone||!service||!date||!time){showToast('Please complete all required fields.');return;}
  if(!/^[0-9+\-\s()]{7,20}$/.test(phone)){showToast('Please enter a valid phone number.');$('customerPhone').focus();return;}
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showToast('Please enter a valid email address.');$('customerEmail').focus();return;}
  if(date<todayISO()){showToast('Past dates are not allowed.');return;}
  if(!availableSlots(date).includes(time)){showToast('That time slot is no longer available. Please choose another.');populateTimeSelect();return;}
  const booking={id:uid('GB'),name,phone,email,serviceId:service.id,serviceName:service.name,price:Number(service.price),duration:Number(service.duration),date,time,notes:$('bookingNotes').value.trim(),status:'Pending',createdAt:new Date().toISOString()};
  state.bookings.unshift(booking);
  if(!saveState()) {state.bookings.shift();return;}
  $('bookingForm').reset(); $('appointmentDate').min=todayISO(); populateServiceSelect(); populateTimeSelect(); updateSummary();
  showToast('Appointment saved successfully!');
  showBookingDialog(booking);
});
function showBookingDialog(b){
  $('dialogContent').innerHTML=`<p class="muted">Your booking reference number is:</p><h2 style="color:var(--rose);font-size:25px">${safe(b.id)}</h2><div class="dialog-details"><p><span>Customer</span><strong>${safe(b.name)}</strong></p><p><span>Service</span><strong>${safe(b.serviceName)}</strong></p><p><span>Date</span><strong>${formatDate(b.date)}</strong></p><p><span>Time</span><strong>${formatTime(b.time)}</strong></p><p><span>Total</span><strong>${money(b.price)}</strong></p><p><span>Status</span><strong>${safe(b.status)}</strong></p></div><p class="muted small">Keep your reference number to find this booking later.</p><button class="btn btn-primary" id="dialogGoRecords">View my bookings</button>`;
  $('detailDialog').showModal();
  $('dialogGoRecords').addEventListener('click',()=>{$('detailDialog').close();navigate('records');});
}
$('closeDialog').addEventListener('click',()=>$('detailDialog').close());

function statusClass(status){return String(status).toLowerCase();}
function renderRecords(){
  const query=$('recordSearch').value.trim().toLowerCase(), status=$('recordStatus').value;
  const records=state.bookings.filter(b=>{
    const matches=[b.name,b.phone,b.id,b.serviceName].some(v=>String(v||'').toLowerCase().includes(query));
    return matches&&(status==='all'||b.status===status);
  });
  $('recordsList').innerHTML=records.length?records.map(b=>`<article class="record-card"><div><h3>${safe(b.serviceName)}</h3><p>${safe(b.name)} · ${safe(b.phone)}</p><p>Ref: <strong>${safe(b.id)}</strong></p></div><div><p>${formatDate(b.date)} · ${formatTime(b.time)}</p><p>${money(b.price)} · ${Number(b.duration)} min</p><span class="status ${statusClass(b.status)}">${safe(b.status)}</span></div><div class="record-actions"><button class="mini-btn" data-detail="${safe(b.id)}">Details</button>${b.status!=='Cancelled'&&b.status!=='Completed'?`<button class="mini-btn danger" data-cancel="${safe(b.id)}">Cancel</button>`:''}</div></article>`).join(''):'<div class="empty-state">No bookings found. Try another search or create a new appointment.</div>';
}
$('recordSearch').addEventListener('input',renderRecords);
$('recordStatus').addEventListener('change',renderRecords);
$('recordsList').addEventListener('click',event=>{
  const detail=event.target.closest('[data-detail]'), cancel=event.target.closest('[data-cancel]');
  if(detail){const b=state.bookings.find(x=>x.id===detail.dataset.detail);if(b)showBookingDialog(b);}
  if(cancel){const b=state.bookings.find(x=>x.id===cancel.dataset.cancel);if(b&&confirm(`Cancel appointment ${b.id}?`)){b.status='Cancelled';saveState();renderRecords();showToast('Appointment cancelled.');}}
});

$('loginForm').addEventListener('submit',event=>{
  event.preventDefault();
  if($('adminUser').value.trim()===ADMIN_USER&&$('adminPass').value===ADMIN_PASS){isAdmin=true;$('loginError').textContent='';$('loginForm').reset();renderAdmin();showToast('Welcome to the admin dashboard.');}
  else $('loginError').textContent='Incorrect username or password.';
});
$('logoutBtn').addEventListener('click',()=>{isAdmin=false;renderAdmin();showToast('You have logged out.');});
function renderAdmin(){
  $('adminLogin').hidden=isAdmin; $('adminPanel').hidden=!isAdmin;
  if(!isAdmin)return;
  const all=state.bookings;
  $('adminStats').innerHTML=[['Total bookings',all.length],['Pending',all.filter(b=>b.status==='Pending').length],['Confirmed',all.filter(b=>b.status==='Confirmed').length],['Completed',all.filter(b=>b.status==='Completed').length]].map(([label,value])=>`<div class="stat-card"><span>${label}</span><strong>${value}</strong></div>`).join('');
  renderAdminAppointments();renderAdminServices();
}
function renderAdminAppointments(){
  const query=$('adminSearch').value.trim().toLowerCase();
  const records=state.bookings.filter(b=>[b.id,b.name,b.phone,b.serviceName].some(v=>String(v||'').toLowerCase().includes(query)));
  $('adminAppointmentRows').innerHTML=records.map(b=>`<tr><td><strong>${safe(b.id)}</strong><small>${safe(b.name)} · ${safe(b.phone)}</small></td><td>${safe(b.serviceName)}<br><small>${money(b.price)}</small></td><td>${formatDate(b.date)}<br><small>${formatTime(b.time)}</small></td><td><select class="status-select" data-status="${safe(b.id)}">${['Pending','Confirmed','Completed','Cancelled'].map(s=>`<option ${b.status===s?'selected':''}>${s}</option>`).join('')}</select></td><td><button class="mini-btn danger" data-delete-booking="${safe(b.id)}">Delete</button></td></tr>`).join('');
  $('adminEmpty').hidden=records.length>0;
}
$('adminSearch').addEventListener('input',renderAdminAppointments);
$('adminAppointmentRows').addEventListener('change',event=>{
  const select=event.target.closest('[data-status]');if(!select)return;
  const b=state.bookings.find(x=>x.id===select.dataset.status);if(!b)return;
  b.status=select.value;saveState();renderAdmin();showToast('Booking status updated.');
});
$('adminAppointmentRows').addEventListener('click',event=>{
  const btn=event.target.closest('[data-delete-booking]');if(!btn)return;
  const id=btn.dataset.deleteBooking;
  if(confirm(`Permanently delete booking ${id}?`)){state.bookings=state.bookings.filter(b=>b.id!==id);saveState();renderAdmin();showToast('Booking deleted.');}
});
document.querySelectorAll('[data-admin-tab]').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('[data-admin-tab]').forEach(b=>b.classList.toggle('active',b===btn));
  $('adminAppointments').hidden=btn.dataset.adminTab!=='appointments';$('adminServices').hidden=btn.dataset.adminTab!=='services';
}));
function renderAdminServices(){
  $('serviceAdminList').innerHTML=state.services.length?state.services.map(s=>`<div class="service-admin-item"><div><strong>${safe(s.name)} · ${money(s.price)}</strong><small>${Number(s.duration)} minutes — ${safe(s.description)}</small></div><div><button class="mini-btn" data-edit-service="${safe(s.id)}">Edit</button><button class="mini-btn danger" data-delete-service="${safe(s.id)}">Delete</button></div></div>`).join(''):'<p class="muted">No services yet. Add your first service above.</p>';
}
$('serviceForm').addEventListener('submit',event=>{
  event.preventDefault();
  const id=$('editServiceId').value, name=$('newServiceName').value.trim(), price=Number($('newServicePrice').value), duration=Number($('newServiceDuration').value), description=$('newServiceDescription').value.trim();
  if(!name||!Number.isFinite(price)||price<1||price>100000||!Number.isInteger(duration)||duration<10||duration>600){showToast('Please enter valid service details.');return;}
  if(id){const s=serviceById(id);if(s)Object.assign(s,{name,price,duration,description});}
  else state.services.push({id:uid('SVC'),name,price,duration,description});
  if(saveState()){resetServiceForm();populateServiceSelect();renderHomeServices();renderAdminServices();showToast(id?'Service updated.':'Service added.');}
});
function resetServiceForm(){$('serviceForm').reset();$('editServiceId').value='';$('newServiceDuration').value=60;$('serviceSaveBtn').textContent='Add service';$('serviceCancelEdit').hidden=true;}
$('serviceCancelEdit').addEventListener('click',resetServiceForm);
$('serviceAdminList').addEventListener('click',event=>{
  const edit=event.target.closest('[data-edit-service]'), del=event.target.closest('[data-delete-service]');
  if(edit){const s=serviceById(edit.dataset.editService);if(!s)return;$('editServiceId').value=s.id;$('newServiceName').value=s.name;$('newServicePrice').value=s.price;$('newServiceDuration').value=s.duration;$('newServiceDescription').value=s.description;$('serviceSaveBtn').textContent='Save changes';$('serviceCancelEdit').hidden=false;$('serviceForm').scrollIntoView({behavior:'smooth',block:'center'});}
  if(del){const id=del.dataset.deleteService,s=serviceById(id);if(!s)return;if(state.bookings.some(b=>b.serviceId===id&&b.status!=='Cancelled')){showToast('This service has active bookings and cannot be deleted yet.');return;}if(confirm(`Delete service "${s.name}"?`)){state.services=state.services.filter(x=>x.id!==id);saveState();populateServiceSelect();renderHomeServices();renderAdminServices();showToast('Service deleted.');}}
});

populateServiceSelect();populateTimeSelect();updateSummary();renderHomeServices();
