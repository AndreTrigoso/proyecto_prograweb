/* HU-3 · Agregar un producto al carrito desde la carta, el detalle, la búsqueda o un reemplazo.
   Resuelve: visitante → iniciar sesión; grupos obligatorios → detalle; local que no recibe pedidos.
   El aviso de «carrito de otro local» lo muestra el CartDrawer común. */
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';
import { resolverSeleccion, seleccionInicial } from './reglas';

export function useAgregarAlCarrito() {
  const { currentRole } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const agregarProducto = (producto, local, { seleccion, cantidad = 1, nota = '', abrirCarrito = true } = {}) => {
    if (currentRole === 'visitante') {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return false;
    }
    if (currentRole !== 'comensal') {
      toast.error('Acción no disponible', 'Solo los comensales pueden hacer pedidos.');
      return false;
    }
    if (!local?.recibePedidos) {
      toast.error('Local sin recepción de pedidos', `${local?.nombreComercial ?? 'El local'} no está recibiendo pedidos en este momento.`);
      return false;
    }
    if (producto.disponibilidad !== 'disponible') {
      toast.error('Producto agotado', `«${producto.nombre}» no está disponible hoy.`);
      return false;
    }
    const sel = resolverSeleccion(producto, seleccion ?? seleccionInicial(producto));
    if (sel.faltan.length) {
      // Los productos con grupos obligatorios se configuran en su detalle (mockup 3.3).
      navigate(`/locales/${producto.localId}/productos/${producto.id}`);
      return false;
    }
    const agregado = addItem(producto, cantidad, sel.opcionesSeleccionadas, nota, { abrirCarrito });
    if (agregado) toast.success('Agregado al carrito', `${cantidad} × ${producto.nombre}`);
    return agregado;
  };

  return { agregarProducto };
}
