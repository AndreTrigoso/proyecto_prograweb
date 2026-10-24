import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { EntregaCodigoView, DetallePedidoView } from '../components/bandeja';

const PaginaEntregaCodigo = () => {
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
    <EntregaCodigoView
      onSelectPedido={(pedido) => setPedidoDetalleId(pedido?.id || null)}
      onShowNotification={notify}
    />
  );
};

export default PaginaEntregaCodigo;
