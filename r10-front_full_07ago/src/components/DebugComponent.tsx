import React from 'react';

const DebugComponent: React.FC = () => {
  console.log('DebugComponent renderizado');
  
  return (
    <div className="p-4 bg-green-100 border border-green-300 rounded">
      <h1 className="text-green-800 font-bold">Debug Component</h1>
      <p className="text-green-700">Este componente renderizou com sucesso!</p>
    </div>
  );
};

export default DebugComponent;
