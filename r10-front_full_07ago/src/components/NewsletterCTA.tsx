import React, { useState } from 'react';

const NewsletterCTA: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Newsletter subscription:', email);
    setEmail('');
    alert('Obrigado por se inscrever!');
  };

  return (
    <div className="bg-brand text-white p-4 rounded-lg">
      <h3 className="font-bold text-sm mb-2">📧 Receba as notícias do R10</h3>
      <p className="text-xs mb-4 opacity-90">
        Fique por dentro das principais notícias do dia direto no seu email.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu melhor email"
          className="w-full px-3 py-2 text-gray-800 text-xs rounded focus:outline-none focus:ring-2 focus:ring-white/50"
          required
        />
        <button
          type="submit"
          className="w-full bg-white text-brand py-2 text-xs font-bold rounded hover:bg-gray-100 transition-colors"
        >
          ASSINAR NEWSLETTER
        </button>
      </form>
    </div>
  );
};

export default NewsletterCTA;