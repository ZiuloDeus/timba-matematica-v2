
const cartasDivCasa = document.getElementById('cartas-casa');
const cartasDivJugador = document.getElementById('cartas-jugador');
const pAcercar = document.getElementById('p-acercar');
const pExacto = document.getElementById('p-exacto');
const pPasar = document.getElementById('p-pasar');
const totalJugadorSpan = document.getElementById('total-jugador');
const totalCasaSpan = document.getElementById('total-casa');
const btnPedir = document.getElementById('btn-pedir');
const btnPlantar = document.getElementById('btn-plantar');
const btnReiniciar = document.getElementById('btn-reiniciar');
const mensajeEstado = document.getElementById('mensaje-estado');

const modal = document.getElementById('modal');
const modalCard = modal.querySelector('.modal-card');
const modalIcon = document.getElementById('modal-icon');
const modalText = document.getElementById('modal-text');
const modalSub = document.getElementById('modal-sub');
const modalReplay = document.getElementById('modal-replay');

let mazo = [];
let jugador = [];
let casa = [];
let terminado = false;

function crearMazo(){
  const base = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  mazo = [];
  for(let i=0;i<4;i++) mazo = mazo.concat(base);
  // mezcla simple Fisher-Yates
  for (let i = mazo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
  }
}

function valorCarta(c){
  if (c === 'A') return 11;
  if (['J','Q','K'].includes(c)) return 10;
  return parseInt(c);
}

function valorMano(mano){
  let total = mano.reduce((acc, c) => acc + valorCarta(c), 0);
  let ases = mano.filter(c => c === 'A').length;
  while(total > 21 && ases > 0){ total -= 10; ases--; }
  return total;
}

function crearDivCarta(valor, oculta=false, delay=0){
  const d = document.createElement('div');
  d.className = 'carta' + (oculta ? ' oculta' : '');
  d.textContent = oculta ? '' : valor;
  if (!oculta){
    d.style.transform = 'translateY(20px) scale(.8)';
    d.style.opacity = '0';
    setTimeout(()=>{ d.style.transform = ''; d.style.opacity = '1'; }, delay);
  } else {
    // pequeña animación para la oculta
    d.style.opacity = '0';
    setTimeout(()=>{ d.style.opacity = '1'; }, delay);
  }
  return d;
}

function mostrarManos(){
  // Casa - la segunda carta inicialmente oculta
  cartasDivCasa.innerHTML = '';
  casa.forEach((c,i)=>{
    const oculta = (i===1 && !terminado); // oculta segunda carta antes de plantar
    const delay = 60 * i;
    const div = crearDivCarta(c, oculta, delay);
    cartasDivCasa.appendChild(div);
  });

  cartasDivJugador.innerHTML = '';
  jugador.forEach((c,i)=>{
    const delay = 60 * i;
    const div = crearDivCarta(c, false, delay);
    cartasDivJugador.appendChild(div);
  });

  totalJugadorSpan.textContent = valorMano(jugador);
  totalCasaSpan.textContent = terminado ? valorMano(casa) : '?';
}

function calcularProbabilidades(valorActual){
  let acercar=0, exacto=0, pasar=0;
  if (mazo.length === 0) return {acercar:0, exacto:0, pasar:0};
  for(const c of mazo){
    let v = valorCarta(c);
    let nuevo = valorActual + v;
    if (v === 11 && nuevo > 21) nuevo -= 10;
    if (nuevo < 21) acercar++;
    else if (nuevo === 21) exacto++;
    else pasar++;
  }
  const t = mazo.length;
  return {
    acercar: ((acercar/t)*100).toFixed(1),
    exacto: ((exacto/t)*100).toFixed(1),
    pasar: ((pasar/t)*100).toFixed(1)
  };
}

function actualizarProb(){
  const v = valorMano(jugador);
  const probs = calcularProbabilidades(v);
  pAcercar.textContent = probs.acercar + '%';
  pExacto.textContent = probs.exacto + '%';
  pPasar.textContent = probs.pasar + '%';
}

function iniciarRonda(){
  terminado = false;
  crearMazo();
  jugador = [mazo.pop(), mazo.pop()];
  casa = [mazo.pop(), mazo.pop()];
  mensajeEstado.textContent = '';
  btnPedir.disabled = false;
  btnPlantar.disabled = false;
  btnReiniciar.style.display = 'none';
  mostrarManos();
  actualizarProb();
}

function repartirCartaJugador(){
  if (terminado) return;
  if (mazo.length === 0) return;
  jugador.push(mazo.pop());
  mostrarManos();
  const v = valorMano(jugador);
  actualizarProb();
  if (v > 21){
    // perdio
    terminarJuego('perdiste', '💥 Te pasaste. Pierdes.', '¡Uy! Esta vez no se dio.');
  }
}

function turnoCasa(){
  // revelar segunda carta y dejar que la casa juegue hasta 17+
  terminado = true;
  mostrarManos();
  // pequeña pausa para drama
  setTimeout(()=>{
    while(valorMano(casa) < 17 && mazo.length > 0){
      casa.push(mazo.pop());
    }
    mostrarManos();
    const valCasa = valorMano(casa);
    const valJug = valorMano(jugador);
    if (valCasa > 21 || valJug > valCasa) terminarJuego('ganaste','🏆 ¡Ganaste!','Buen cálculo — seguí así');
    else if (valCasa === valJug) terminarJuego('empate','🤝 Empate.','Casi igualados');
    else terminarJuego('perdiste','💀 La casa gana.','La casa se llevó esta');
  }, 450);
}

function terminarJuego(clase, titulo, sub){
  terminado = true;
  btnPedir.disabled = true;
  btnPlantar.disabled = true;
  btnReiniciar.style.display = 'inline-block';
  mensajeEstado.textContent = titulo;

  // Modal
  modalCard.classList.remove('win','lose');
  if (clase === 'ganaste'){
    modalIcon.textContent = '🏆';
    modalCard.classList.add('win');
  } else if (clase === 'perdiste'){
    modalIcon.textContent = '💀';
    modalCard.classList.add('lose');
  } else {
    modalIcon.textContent = '🤝';
  }
  modalText.textContent = titulo;
  modalSub.textContent = sub;
  modal.classList.remove('hidden');
  // botón para cerrar/replayará la ronda
}

btnPedir.addEventListener('click', ()=>{
  repartirCartaJugador();
});

btnPlantar.addEventListener('click', ()=>{
  turnoCasa();
});

btnReiniciar.addEventListener('click', ()=>{
  modal.classList.add('hidden');
  iniciarRonda();
});
modalReplay.addEventListener('click', ()=>{
  modal.classList.add('hidden');
  iniciarRonda();
});

// atajos teclado
document.addEventListener('keydown', (e)=>{
  if (e.key === 'h' || e.key === 'H') repartirCartaJugador();
  if (e.key === 's' || e.key === 'S') turnoCasa();
});

// inicia cuando la página carga
window.addEventListener('load', ()=>{
  iniciarRonda();
});
