import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { ResumenDiaView, DetallePedidoView } from '../components/bandeja';

const PaginaResumenDia = () => {
  const { notify } = useToast();
  const [pedidoDetalleId, setPedidoDetalleId] = useState(null);

  if (pedidoDetalleId) {
    return (
      <DetallePedidoView
        pedidoId={pedidoDetalleId}
        onBack={() => setPedidoDetalleId(null)}
        onShowNotification={notify}
      />
    );
  }

  return (
    <ResumenDiaView
      onSelectPedido={(pedido) => setPedidoDetalleId(pedido?.id || null)}
      onShowNotification={notify}
    />
  );
};

export default PaginaResumenDia;
