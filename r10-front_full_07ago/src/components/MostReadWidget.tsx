import React from 'react';

// Forçando atualização para limpar o cache do Vite
interface MostReadWidgetProps {}

const MostReadWidget: React.FC<MostReadWidgetProps> = () => {
  return (
    <div className="bg-red-500 text-white p-8 rounded-lg border-4 border-yellow-400">
      <h1 className="text-3xl font-black text-center">🚨 MUDANÇA TESTE 🚨</h1>
      <p className="text-xl text-center mt-4">SE VOCÊ VÊ ISSO, AS MUDANÇAS FUNCIONAM!</p>
      <p className="text-center mt-2">Timestamp: {new Date().getTime()}</p>
    </div>
  );
};

export default MostReadWidget;