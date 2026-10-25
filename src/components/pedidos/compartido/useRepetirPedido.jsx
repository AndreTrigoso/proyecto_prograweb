/* HU-4 · «Repetir» (mockup 4.3): vuelve a poner en el carrito los productos de un pedido anterior,
   con los precios de hoy. Si el carrito tiene productos de otro local, primero pide confirmación para vaciarlo. */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common';
import { misPedidosService } from '../../../services/misPedidosService';

export function useRepetirPedido() {
  const { items, localId, activeLocal, addItem, clearCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [porConfirmar, setPorConfirmar] = useState(null); // { pedido, lineas, omitidos }
  const [pendiente, setPendiente] = useState(null);       // se agrega cuando el carrito ya quedó vacío

  const agregar = ({ pedido, lineas, omitidos }) => {
    lineas.forEach((l) => addItem(l.producto, l.cantidad, l.opcionesSeleccionadas, l.nota, { abrirCarrito: false }));
    const n = lineas.reduce((s, l) => s + l.cantidad, 0);
    toast.success('Pedido repetido', `Agregamos ${n} ${n === 1 ? 'producto' : 'productos'} de ${pedido.codigoPedido} a tu carrito.`);
    if (omitidos.length) toast.info('Algunos productos no se agregaron', `${omitidos.join(', ')}: no están disponibles hoy.`);
    navigate('/carrito');
  };

  // Tras vaciar el carrito, se espera al siguiente render para agregar sobre el carrito vacío.
  useEffect(() => {
    if (pendiente && items.length === 0) {
      setPendiente(null);
      agregar(pendiente);
    }
  }, [pendiente, items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const repetir = (pedido) => {
    const { lineas, omitidos } = misPedidosService.lineasParaRepetir(pedido);
    if (!lineas.length) {
      toast.error('No se puede repetir', `Ninguno de los productos de ${pedido.codigoPedido} está disponible hoy en ${pedido.nombreLocal}.`);
      return;
    }
    const datos = { pedido, lineas, omitidos };
    if (items.length && localId !== pedido.localId) setPorConfirmar(datos);
    else agregar(datos);
  };

  const modal = (
    <ConfirmModal
      isOpen={!!porConfirmar}
      title="Tu carrito tiene otro local"
      message={`Tu carrito tiene productos de ${activeLocal?.nombreComercial ?? 'otro local'}. ¿Vaciarlo y repetir el pedido ${porConfirmar?.pedido.codigoPedido}?`}
      confirmText="Vaciar y repetir"
      onConfirm={() => { const d = porConfirmar; setPorConfirmar(null); clearCart(); setPendiente(d); }}
      onCancel={() => setPorConfirmar(null)}
    />
  );

  return { repetir, modal };
}
