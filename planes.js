// Aviones low-poly armados con código (sin archivos externos).
// Ejes del modelo: nariz hacia +Z, arriba +Y, ala izquierda +X. Largo total = 1.
export const PLANES = {
  fw190:    { name: 'Fw 190',    span: 1.17, body: '#7E8B8E', belly: '#AEB9BD', accent: '#E3B320', engine: 'radial', blades: 3, wing: { k: 5,  tip: .45 }, mark: 'cross' },
  spitfire: { name: 'Spitfire',  span: 1.23, body: '#56613F', belly: '#9AA3A4', accent: '#C9D1A3', engine: 'inline', blades: 4, wing: { k: 2,  tip: 1 },   mark: 'roundel' },
  zero:     { name: 'A6M Zero',  span: 1.32, body: '#C9C6AE', belly: '#BDBAA3', accent: '#1C1C1C', engine: 'radial', blades: 3, wing: { k: 3,  tip: .5 },  mark: 'hinomaru' },
  mustang:  { name: 'P-51 Mustang', span: 1.15, body: '#BFC4C9', belly: '#AEB3B8', accent: '#D6282B', engine: 'inline', blades: 4, wing: { k: 24, tip: .5 },  mark: 'star', metal: true },
};

export function buildPlane(THREE, id){
  const P = PLANES[id], g = new THREE.Group();
  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: P.metal ? .35 : .75, metalness: P.metal ? .55 : .1, ...o });
  const body = mat(P.body), belly = mat(P.belly), accent = mat(P.accent), dark = mat('#222326'), glass = mat('#8FB6D9', { transparent: true, opacity: .55, roughness: .1, metalness: .3 });

  // fuselaje (torno) — radial: nariz ancha; en línea: nariz afinada
  const prof = P.engine === 'radial'
    ? [[0,-.5],[.018,-.47],[.04,-.28],[.058,-.05],[.068,.18],[.074,.33],[.074,.43],[.06,.45]]
    : [[0,-.5],[.016,-.47],[.036,-.3],[.052,-.05],[.058,.15],[.054,.33],[.042,.43],[.03,.46]];
  const lathe = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 14);
  lathe.rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(lathe, body));

  // ala principal: contorno con puntas más o menos redondeadas
  const wing = (span, root, tipRatio, k, z0, t) => {
    const s = span / 2, n = 24, le = [], te = [];
    for (let i = 0; i <= n; i++) {
      const x = -s + (2 * s * i) / n, a = Math.abs(x) / s;
      const c = root * (1 - (1 - tipRatio) * a) * Math.pow(Math.max(0, 1 - Math.pow(a, k)), .5) + .002;
      le.push([x, z0 + c * .4]); te.push([x, z0 - c * .6]);
    }
    const sh = new THREE.Shape();
    [...le, ...te.reverse()].forEach(([x, z], i) => i ? sh.lineTo(x, z) : sh.moveTo(x, z));
    const geo = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false });
    geo.rotateX(Math.PI / 2); geo.translate(0, t / 2, 0);
    return geo;
  };
  const w = new THREE.Mesh(wing(P.span, .2, P.wing.tip ?? .55, P.wing.k, .1, .014), body);
  w.position.y = -.025; g.add(w);
  const stab = new THREE.Mesh(wing(.38, .1, .55, 3, -.4, .008), body); stab.position.y = .005; g.add(stab);

  // deriva vertical
  const fin = new THREE.Shape();
  [[-.5,0],[-.33,0],[-.4,.1],[-.44,.145],[-.49,.15],[-.52,.1]].forEach(([z, y], i) => i ? fin.lineTo(z, y) : fin.moveTo(z, y));
  const finGeo = new THREE.ExtrudeGeometry(fin, { depth: .008, bevelEnabled: false });
  finGeo.rotateY(-Math.PI / 2); finGeo.translate(.004, .02, 0);
  g.add(new THREE.Mesh(finGeo, body));

  // cabina
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), glass);
  canopy.scale.set(.032, .04, .09); canopy.position.set(0, .045, .02); g.add(canopy);

  // motor, capó y hélice
  const noseZ = P.engine === 'radial' ? .45 : .46;
  if (P.engine === 'radial') {
    const cowl = new THREE.Mesh(new THREE.CylinderGeometry(.074, .074, .05, 16, 1, true), id === 'zero' ? dark : accent);
    cowl.rotation.x = Math.PI / 2; cowl.position.z = .43; g.add(cowl);
    const face = new THREE.Mesh(new THREE.CircleGeometry(.07, 16), dark); face.position.z = noseZ; g.add(face);
  } else {
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(.03, .045, .06, 12), accent);
    nose.rotation.x = Math.PI / 2; nose.position.z = .43; g.add(nose);
  }
  const spinner = new THREE.Mesh(new THREE.ConeGeometry(P.engine === 'radial' ? .028 : .032, .07, 12), accent);
  spinner.rotation.x = Math.PI / 2; spinner.position.z = noseZ + .035; g.add(spinner);
  const prop = new THREE.Group(); prop.position.z = noseZ + .015;
  for (let i = 0; i < P.blades; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(.018, .16, .006), dark);
    b.position.y = .08; const arm = new THREE.Group(); arm.add(b); arm.rotation.z = (i / P.blades) * Math.PI * 2; prop.add(arm);
  }
  g.add(prop); g.userData.prop = prop;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(.17, 24), mat('#333', { transparent: true, opacity: .12 }));
  disc.position.z = noseZ + .012; g.add(disc);

  if (id === 'mustang') {           // toma de aire ventral
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(.04, .035, .14), belly); scoop.position.set(0, -.06, -.06); g.add(scoop);
  }
  if (id === 'fw190') {             // franja amarilla bajo el capó
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .03, 14, 1, true), accent);
    band.rotation.x = Math.PI / 2; band.position.z = -.3; g.add(band);
  }

  // insignias sobre las alas
  const top = -.025 + .0075, tipX = P.span / 2 * .62;
  const decal = (geo, color, x, z, y = top) => { const m = new THREE.Mesh(geo, mat(color, { flatShading: false, roughness: .9, metalness: 0 })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); g.add(m); return m; };
  for (const sx of [-1, 1]) {
    const x = sx * tipX, z = .09;
    if (P.mark === 'roundel') { decal(new THREE.CircleGeometry(.045, 20), '#23315A', x, z); decal(new THREE.CircleGeometry(.02, 20), '#A22A2A', x, z, top + .0005); }
    if (P.mark === 'hinomaru') { decal(new THREE.CircleGeometry(.04, 20), '#C8102E', x, z); }
    if (P.mark === 'star') { decal(new THREE.CircleGeometry(.04, 20), '#1D2B5A', x, z); decal(new THREE.CircleGeometry(.024, 5), '#F2F2F2', x, z, top + .0005).rotation.z = Math.PI / 2; }
    if (P.mark === 'cross') {
      decal(new THREE.PlaneGeometry(.075, .02), '#F2F2F2', x, z); decal(new THREE.PlaneGeometry(.02, .075), '#F2F2F2', x, z);
      decal(new THREE.PlaneGeometry(.06, .011), '#111', x, z, top + .0005); decal(new THREE.PlaneGeometry(.011, .06), '#111', x, z, top + .0005);
    }
  }
  return g;
}
