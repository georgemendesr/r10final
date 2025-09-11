// Teste para verificar se o resumo está sendo carregado no PostForm

import React, { useEffect, useState } from 'react';
import { getPostById } from '../services/postsService';

const ResumoTeste = () => {
  const [resumoData, setResumoData] = useState(null);
  
  useEffect(() => {
    // Testar com o post ID 21 que sabemos que tem resumo
    getPostById('21').then(data => {
      console.log('📝 Dados do post 21:', data);
      console.log('📝 Resumo do post 21:', data.resumo);
      setResumoData({
        id: data.id,
        titulo: data.titulo,
        resumo: data.resumo,
        resumoLength: data.resumo ? data.resumo.length : 0
      });
    }).catch(err => {
      console.error('❌ Erro ao buscar post:', err);
    });
  }, []);
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '2px solid blue', 
      padding: '20px', 
      maxWidth: '300px', 
      zIndex: 9999,
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ color: 'blue', margin: '0 0 10px 0' }}>🧪 Teste Resumo</h3>
      
      {resumoData ? (
        <div>
          <p><strong>Post:</strong> {resumoData.titulo}</p>
          <p><strong>ID:</strong> {resumoData.id}</p>
          <p><strong>Resumo presente:</strong> {resumoData.resumo ? '✅ SIM' : '❌ NÃO'}</p>
          <p><strong>Tamanho:</strong> {resumoData.resumoLength} chars</p>
          
          {resumoData.resumo && (
            <div>
              <p><strong>Preview:</strong></p>
              <textarea 
                value={resumoData.resumo} 
                readOnly 
                style={{ 
                  width: '100%', 
                  height: '100px', 
                  fontSize: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '4px'
                }} 
              />
            </div>
          )}
        </div>
      ) : (
        <p>🔄 Carregando...</p>
      )}
    </div>
  );
};

export default ResumoTeste;