import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './config.js';
export const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
export const $=id=>document.getElementById(id);
export const PALETTES=[['Dorado','#D4AF37'],['Morado','#9B59B6'],['Azul','#2980B9'],['Rojo','#C0392B'],['Verde militar','#9DAE67'],['Esmeralda','#2ECC71'],['Turquesa','#1ABC9C'],['Cian','#00BCD4'],['Azul eléctrico','#2563EB'],['Azul marino','#1E3A8A'],['Violeta','#7C3AED'],['Lavanda','#B794F4'],['Rosa neón','#EC4899'],['Fucsia','#D946EF'],['Naranja','#F97316'],['Ámbar','#F59E0B'],['Amarillo','#FACC15'],['Cobre','#B87333'],['Bronce','#CD7F32'],['Plata','#C0C0C0'],['Blanco hielo','#E0F2FE'],['Gris titanio','#64748B'],['Negro carbón','#27272A'],['Verde lima','#84CC16']];
export function notice(id,content,success=false){const n=$(id);n.textContent=content;n.className='notice '+(success?'good':'bad');n.classList.remove('hidden')}
export function visible(id,on){$(id).classList.toggle('hidden',!on)}
export function safeUrl(s){if(!s)return null;try{const u=new URL(s);return u.protocol==='https:'?u.href:null}catch{return null}}
export function mediaNode(url,type,{autoplay=false}={}){const safe=safeUrl(url);if(!safe)return null;const m=document.createElement(type==='video'?'video':'img');m.src=safe;if(type==='video'){m.muted=true;m.loop=true;m.playsInline=true;m.autoplay=autoplay;m.controls=!autoplay;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){m.autoplay=false;m.controls=true}}else{m.alt='Imagen de la tienda';m.loading='lazy'}return m}
export function applyAccent(color){if(/^#[\da-fA-F]{6}$/.test(color||''))document.documentElement.style.setProperty('--accent',color)}
export function renderBackdrop(target,url,type){target.querySelectorAll(':scope > img,:scope > video').forEach(el=>el.remove());const m=mediaNode(url,type,{autoplay:true});if(m)target.prepend(m)}
export function currency(value){return '$'+Number(value||0).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})+' MXN'}
