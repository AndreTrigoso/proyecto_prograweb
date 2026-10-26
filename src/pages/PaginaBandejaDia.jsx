import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { BandejaDiaView, DetallePedidoView } from '../components/bandeja';

const PaginaBandejaDia = () => {
  const navigate = useNavigate();
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
    <BandejaDiaView
      onSelectPedido={(pedido) => setPedidoDetalleId(pedido?.id || null)}
      onNavigateEntregaCodigo={() => navigate('/local/entrega')}
      onNavigateMiCarta={() => navigate('/local/mi-carta')}
      onShowNotification={notify}
    />
  );
};

export default PaginaBandejaDia;
