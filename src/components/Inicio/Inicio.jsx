import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import Boton from '../Boton/Boton.jsx';
import ImagenProvisional from '../ImagenProvisional/ImagenProvisional.jsx';

import './Inicio.css';

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

const ESTADOS = {
  abierto: { texto: 'Abierto', clase: 'etiqueta--abierto' },
  suspendido: { texto: 'Suspendido', clase: 'etiqueta--suspendido' },
  cerrado: { texto: 'Cerrado', clase: 'etiqueta--cerrado' }
};

const PASOS = [
  { titulo: 'Elige tu local', texto: 'Revisa la carta del día, el precio y el tiempo de preparación.' },
  { titulo: 'Arma tu pedido', texto: 'Agrega productos con sus opciones, agregados y notas.' },
  { titulo: 'Recoge con tu código', texto: 'Dicta tu código en el mostrador y paga ahí mismo.' }
];

// "Pabellón A · 07:00 a 19:00 · 12 min" con el horario de hoy.
function detalleLocal(local) {
  const hoy = (local.horarioAtencion ?? []).find((h) => h.dia === DIAS[new Date().getDay()]);
  const horas = hoy?.abierto ? `${hoy.horaApertura} a ${hoy.horaCierre}` : 'Cerrado hoy';
  return `${local.ubicacionCampus} · ${horas} · ${local.tiempoEstimadoMin} min`;
}

export default function Inicio() {
  usePageTitle('Pide antes, recoge sin hacer cola');
  const { locales, productos } = useData();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [busqueda, setBusqueda] = useState('');

  // Enlace "Cómo funciona" de la cabecera y del pie: /#como-funciona
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  const { publicados, desde } = useMemo(() => {
    const aperturas = locales.flatMap((l) => l.horarioAtencion ?? []).filter((h) => h.abierto).map((h) => h.horaApertura).sort();
    return { publicados: productos.filter((p) => p.disponibilidad !== 'retirado').length, desde: aperturas[0] };
  }, [locales, productos]);

  const buscar = (e) => {
    e.preventDefault();
    const q = busqueda.trim();
    navigate(q ? `/locales?q=${encodeURIComponent(q)}` : '/locales');
  };

  return (
    <>
      <section className="hero">
        <div className="pagina hero__interior">
          <div>
            <h1>Pide antes, recoge sin hacer cola</h1>
            <p>Elige un local del campus, arma tu pedido con sus opciones y escoge la hora de recojo. Pagas en el mostrador al recibirlo.</p>
            <form className="hero__buscador" onSubmit={buscar} role="search">
              <input className="form-input" type="search" aria-label="Buscar productos o locales" placeholder="Busca «sándwich» o «Cafetería Central»"
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              <Boton type="submit">Buscar</Boton>
            </form>
            <p className="hero__datos">
              {locales.length} locales en el campus · {publicados} productos publicados{desde && ` · Recojo desde las ${desde}`}
            </p>
          </div>
          <ImagenProvisional className="hero__foto" label="foto hero · mostrador de cafetería del campus" />
        </div>
      </section>

      <div className="pagina inicio">
        <section aria-labelledby="locales-titulo">
          <div className="inicio__cabecera">
            <h2 id="locales-titulo">Locales del campus</h2>
            <Link to="/locales">Ver todos los locales →</Link>
          </div>
          <div className="locales">
            {locales.slice(0, 4).map((local) => {
              const estado = ESTADOS[local.estado] ?? ESTADOS.cerrado;
              return (
                <Link key={local.id} to="/locales" className={`local ${local.estado === 'cerrado' ? 'local--cerrado' : ''}`}>
                  <ImagenProvisional className="local__foto" label="foto local" src={local.fotografias?.[0]} alt={local.nombreComercial} />
                  <div className="local__cuerpo">
                    <p className="local__nombre">{local.nombreComercial} <span className={`etiqueta ${estado.clase}`}>{estado.texto}</span></p>
                    <p className="local__detalle">{detalleLocal(local)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="como-funciona" aria-labelledby="como-titulo">
          <div className="inicio__cabecera"><h2 id="como-titulo">Cómo funciona</h2></div>
          <div className="pasos-inicio">
            {PASOS.map((paso, i) => (
              <div className="card paso" key={paso.titulo}>
                <span className="paso__numero">{i + 1}</span>
                <h3>{paso.titulo}</h3>
                <p>{paso.texto}</p>
              </div>
            ))}
          </div>
          <div className="invitacion">
            <div>
              <h2>¿Atiendes un local en el campus?</h2>
              <p>Publica tu carta y recibe pedidos anticipados con hora de recojo.</p>
            </div>
            <Boton to="/registro-local" variante="verde">Registrar mi local</Boton>
          </div>
        </section>
      </div>
    </>
  );
}
