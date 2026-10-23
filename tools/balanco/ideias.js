// Estratégias "óbvias" escritas à mão, pelo kit de cada um — viram ponto de partida da busca.
const e=(i,g,p)=>({i,g:g||'sempre',p:p==null?0:p});
const P=(lista,alvo)=>({alvo:alvo||'ia', lista});
module.exports=function(id){
  const I={
    fat_smerg:[ P([e(2,'rodadaAte',1),e(3),e(1,'inimigos2'),e(0)]), P([e(4,'rodadaAte',1),e(2,'rodadaAte',2),e(3),e(1)]), P([e(3),e(1),e(0)],'pct') ],
    strong_smerg:[ P([e(2,'rodadaAte',1),e(3),e(1),e(0)]), P([e(3),e(1),e(0)],'pct'), P([e(2,'usosMenos',2),e(3,'rodadaDepois',2),e(1),e(0)]) ],
    serrinha_dog:[ P([e(3),e(1,'inimigos2'),e(2),e(0)]), P([e(2),e(3),e(1),e(0)],'forte'), P([e(4,'rodadaAte',1),e(3),e(1),e(0)]) ],
    fat_mango:[ P([e(4,'rodadaAte',1),e(3,'timeFerido',.6),e(1),e(2),e(0)]), P([e(1),e(2),e(3,'timeFerido',.6),e(0)]), P([e(4,'rodadaAte',2),e(1),e(2),e(0)],'pct') ],
    mecas:[ P([e(3),e(1,'inimigos2'),e(0)]), P([e(3),e(2),e(1),e(0)],'pct'), P([e(-1,'vidaMais',.55),e(3),e(1),e(0)]) ],
    loirinha_cdi:[ P([e(2,'timeFerido',.6),e(3,'timeFerido',.8),e(1),e(0)]), P([e(1),e(0)],'pct'), P([e(3,'rodadaAte',2),e(2,'timeFerido',.7),e(1),e(0)]) ],
    smergula:[ P([e(4,'rodadaAte',2),e(1),e(2),e(0)]), P([e(1),e(2),e(3),e(0)],'pct'), P([e(3,'rodadaAte',1),e(4),e(1),e(2),e(0)]) ],
    matheus_limeira2:[ P([e(1,'rodadaAte',1),e(3),e(0)]), P([e(3),e(0)],'pct'), P([e(2,'rodadaAte',1),e(3),e(0)]) ],
    hans_lambanca:[ P([e(1,'rodadaAte',1),e(3),e(0)]), P([e(3),e(0)],'forte'), P([e(2,'timeFerido',.5),e(1,'rodadaAte',2),e(3),e(0)]) ],
    adulto_feliz:[ P([e(4),e(3),e(1,'inimigos2'),e(0)]), P([e(3),e(1),e(0)],'pct'), P([e(2,'rodadaAte',1),e(4),e(3),e(1),e(0)]) ],
    // a ideia do dono: meditar DUAS vezes antes de bater
    fat_girl:[ P([e(4,'usosMenos',2),e(2),e(1),e(3),e(0)]), P([e(4,'usosMenos',1),e(2),e(1),e(3),e(0)]), P([e(4,'usosMenos',3),e(2),e(1),e(3),e(0)]), P([e(2),e(1),e(3),e(0)],'pct') ],
    marcelao_black_jw:[ P([e(3,'rodadaAte',1),e(4),e(1),e(0)]), P([e(1),e(2,'inimigos2'),e(0)],'pct'), P([e(4,'rodadaAte',2),e(3,'timeFerido',.7),e(1),e(0)]) ],
    cargas:[ P([e(3),e(2,'inimigos2'),e(1),e(0)]), P([e(1),e(3),e(2),e(0)],'pct') ],
    // rework 1.47: 0 esfregada (paga vida) · 1 estocada · 2 chão ensaboado · 3 kamikaze · 4 ult (entrega / véu no verme)
    careca:[ P([e(3),e(1),e(0)],'pct'), P([e(4,'vidaMenos',.5),e(3),e(1),e(0)],'pct'), P([e(3,'vidaMais',.5),e(1),e(2,'inimigos2'),e(0)]), P([e(4,'rodadaDepois',1),e(1),e(0)]) ],
    tupas:[ P([e(4),e(1,'inimigos2'),e(0)]), P([e(2,'rodadaAte',1),e(4),e(0)]), P([e(0),e(4)],'pct') ],
    cabelin:[ P([e(4,'rodadaAte',1),e(1,'timeFerido',.6),e(3),e(2),e(0)]), P([e(3),e(2),e(0)],'pct'), P([e(1,'timeFerido',.5),e(3),e(0)]) ],
    smergulao:[ P([e(3,'rodadaAte',1),e(1),e(0)]), P([e(1),e(0)],'pct'), P([e(2,'vidaMenos',.5),e(1),e(0)]) ],
    crianca_rosa:[ P([e(3),e(2,'timeFerido',.6),e(1,'timeFerido',.6),e(0)]), P([e(0)],'pct') ],
    // a ideia do dono: o Mano Coxinha só come (a ult) quando já tomou dano
    mano_coxinha:[ P([e(3,'vidaMenos',.99),e(1),e(2,'inimigos2'),e(0)]), P([e(3,'vidaMenos',.7),e(1),e(2),e(0)]), P([e(3,'rodadaDepois',1),e(1),e(0)],'pct') ],
    prodocimo:[ P([e(3),e(1),e(2,'inimigos2'),e(0)]), P([e(1),e(0)],'pct'), P([e(2,'rodadaAte',1),e(3),e(1),e(0)]) ],
    dmaterelizador:[ P([e(3),e(1),e(0)],'pct'), P([e(2,'rodadaAte',1),e(3),e(1),e(0)]), P([e(3),e(1),e(0)],'forte') ]
  };
  return I[id]||[];
};
