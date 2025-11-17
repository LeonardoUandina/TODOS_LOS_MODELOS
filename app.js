// app.js
// Mantén este archivo en la misma carpeta que index.html

// ---------- Datos de ejemplo (placeholders) ----------
// Sustituye por los resultados reales exportados desde Python (ver snippet abajo)
const SAMPLE = {
  counts: { train: 40500, val: 4500, test: 5000 },
  epochs: 15,
  losses: {
    train: [2.34, 2.10, 1.96, 1.85, 1.76, 1.68, 1.60, 1.54, 1.48, 1.43, 1.39, 1.35, 1.31, 1.28, 1.25],
    val:   [2.50, 2.30, 2.12, 1.98, 1.92, 1.87, 1.83, 1.80, 1.79, 1.78, 1.77, 1.76, 1.76, 1.75, 1.74]
  },
  bleu: {
    rnn: 0.078,
    lstm: 0.145,
    gru: 0.132,
    transformer: 0.231
  },
  examples: [
    { src: "hola, ¿cómo estás?", pred: "bonjour, comment ça va ?", ref: "bonjour, comment vas-tu ?" },
    { src: "me gusta la comida francesa", pred: "j'aime la cuisine française", ref: "j'aime la nourriture française" },
    { src: "mañana voy a estudiar", pred: "demain je vais étudier", ref: "demain je vais étudier" }
  ]
};

// ---------- Helper updates ----------
function formatPct(x) { return (x*100).toFixed(2) + "%"; }
function formatBLEU(x){ return (x*100).toFixed(2) + " (aprox.)"; }

// ---------- DOM refs ----------
const elTrain = document.getElementById("count-train");
const elVal   = document.getElementById("count-val");
const elTest  = document.getElementById("count-test");
const elBleuTrans = document.getElementById("bleu-transform");
const elBest = document.getElementById("best-model");
const elEpochs = document.getElementById("epochs");
const examplesBox = document.getElementById("examples");

// Charts
let lossChart = null;
let bleuChart = null;

function computeBestModel(bleuObj){
  const entries = Object.entries(bleuObj);
  entries.sort((a,b)=> b[1]-a[1]);
  return entries[0][0];
}

function renderSummary(data){
  elTrain.textContent = `Train: ${data.counts.train}`;
  elVal.textContent   = `Val: ${data.counts.val}`;
  elTest.textContent  = `Test: ${data.counts.test}`;
  elBleuTrans.textContent = data.bleu.transformer ? formatBLEU(data.bleu.transformer) : "—";
  elBest.textContent = computeBestModel(data.bleu).toUpperCase();
  elEpochs.textContent = `${data.epochs} épocas`;
}

function renderExamples(data){
  examplesBox.innerHTML = "";
  (data.examples || []).forEach((ex,i)=>{
    const div = document.createElement("div");
    div.className = "example";
    div.innerHTML = `<h5>#${i+1} | ES: ${ex.src}</h5>
                     <p><strong>Pred:</strong> ${ex.pred}</p>
                     <p><strong>Ref:</strong> ${ex.ref}</p>`;
    examplesBox.appendChild(div);
  });
}

function renderLossChart(data){
  const ctx = document.getElementById("lossChart").getContext("2d");
  const labels = Array.from({length: data.epochs}, (_,i) => i+1);

  if (lossChart) lossChart.destroy();
  lossChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Train Loss', data: data.losses.train, fill:false, tension:0.2, borderWidth:2 },
        { label: 'Val Loss',   data: data.losses.val,   fill:false, tension:0.2, borderWidth:2 }
      ]
    },
    options: {
      responsive:true,
      plugins:{ legend:{ position:'top' } },
      scales:{
        x:{ title:{ display:true, text:'Época' } },
        y:{ title:{ display:true, text:'Loss' } }
      }
    }
  });
}

function renderBleuChart(data){
  const ctx = document.getElementById("bleuChart").getContext("2d");
  const labels = ["RNN","LSTM + Att","GRU + Att","Transformer"];
  const values = [ data.bleu.rnn, data.bleu.lstm, data.bleu.gru, data.bleu.transformer ];

  if (bleuChart) bleuChart.destroy();
  bleuChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'BLEU (valor)', data: values, borderRadius:6 }]
    },
    options: {
      responsive:true,
      plugins:{
        legend:{ display:false },
        tooltip:{
          callbacks:{
            label: (ctx) => `BLEU ≈ ${(ctx.parsed.y*100).toFixed(2)}`
          }
        }
      },
      scales:{
        x:{ title:{ display:false } },
        y:{
          title:{ display:true, text:'BLEU (0-1)' },
          ticks: { callback: (v)=> (v*100).toFixed(0) + "%" }
        }
      }
    }
  });
}

// ---------- Cargar y aplicar datos ----------
function applyData(data){
  // Validación mínima
  if(!data.counts || !data.losses || !data.bleu){
    alert("JSON no contiene campos esperados (counts, losses, bleu).");
    return;
  }
  renderSummary(data);
  renderExamples(data);
  renderLossChart(data);
  renderBleuChart(data);
}

// Inicializa con SAMPLE
applyData(SAMPLE);

// Evento para cargar archivo JSON
document.getElementById("btnApply").addEventListener("click", ()=>{
  const f = document.getElementById("fileInput").files[0];
  if(!f){
    // Si no selecciona archivo, usa SAMPLE (o podrías alertar)
    applyData(SAMPLE);
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try{
      const json = JSON.parse(e.target.result);
      applyData(json);
    }catch(err){
      alert("Error parseando JSON: " + err.message);
    }
  };
  reader.readAsText(f);
});
