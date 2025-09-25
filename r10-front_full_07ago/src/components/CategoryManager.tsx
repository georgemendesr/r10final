import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Palette } from 'lucide-react';
import { get as apiGet, post as apiPost, del as apiDel } from '../services/api';

interface Category {
  id: string;
  name: string;
  color: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

interface Municipality {
  id: string;
  name: string;
  color: string;
  categoryId: string;
}

const CategoryManager = () => {
  const [activeTab, setActiveTab] = useState<'editorials' | 'municipalities' | 'specials'>('editorials');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  
  // Estados para formulários
  const [newEditorial, setNewEditorial] = useState({ name: '', color: '#3B82F6' });
  const [newMunicipality, setNewMunicipality] = useState({ name: '', color: '#6B7280' });
  const [newSpecial, setNewSpecial] = useState({ name: '', color: '#8B5CF6' });

  // Dados simulados
  const [editorials, setEditorials] = useState<Category[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [specials, setSpecials] = useState<Category[]>([]);

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      try {
        const [eds, muns, sps] = await Promise.all([
          apiGet<{ items: any[] }>(`/categories?type=editorial`),
          apiGet<{ items: any[] }>(`/categories?type=municipality`),
          apiGet<{ items: any[] }>(`/categories?type=special`)
        ]);
        if (!mounted) return;
        setEditorials((eds.items || []).map((i) => ({ id: String(i.id), name: i.name, color: i.color, subcategories: [] })));
        setMunicipalities((muns.items || []).map((i) => ({ id: String(i.id), name: i.name, color: i.color, categoryId: '0' })));
        setSpecials((sps.items || []).map((i) => ({ id: String(i.id), name: i.name, color: i.color, subcategories: [] })));
      } catch (_) {
        // manter vazio em erro
      }
    };
    loadAll();
    return () => { mounted = false; };
  }, []);

  const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#EC4899', '#F43F5E', '#6B7280', '#374151'
  ];

  const handleSaveEditorial = async () => {
    if (!newEditorial.name.trim()) return;
    const created = await apiPost<any>(`/categories`, { name: newEditorial.name.toUpperCase(), color: newEditorial.color, type: 'editorial' });
    setEditorials([...editorials, { id: String(created.id), name: created.name, color: created.color, subcategories: [] }]);
    setNewEditorial({ name: '', color: '#3B82F6' });
  };

  const handleSaveMunicipality = async () => {
    if (!newMunicipality.name.trim()) return;
    const created = await apiPost<any>(`/categories`, { name: newMunicipality.name.toUpperCase(), color: newMunicipality.color, type: 'municipality' });
    setMunicipalities([...municipalities, { id: String(created.id), name: created.name, color: created.color, categoryId: '0' }]);
    setNewMunicipality({ name: '', color: '#6B7280' });
  };

  const handleSaveSpecial = async () => {
    if (!newSpecial.name.trim()) return;
    const created = await apiPost<any>(`/categories`, { name: newSpecial.name.toUpperCase(), color: newSpecial.color, type: 'special' });
    setSpecials([...specials, { id: String(created.id), name: created.name, color: created.color, subcategories: [] }]);
    setNewSpecial({ name: '', color: '#8B5CF6' });
  };

  const handleDeleteEditorial = async (id: string) => {
    await apiDel(`/categories/${id}`);
    setEditorials(editorials.filter(ed => ed.id !== id));
  };

  const handleDeleteMunicipality = async (id: string) => {
    await apiDel(`/categories/${id}`);
    setMunicipalities(municipalities.filter(mun => mun.id !== id));
  };

  const handleDeleteSpecial = async (id: string) => {
    await apiDel(`/categories/${id}`);
    setSpecials(specials.filter(sp => sp.id !== id));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'editorials', label: 'Editoriais', count: editorials.length },
            { id: 'municipalities', label: 'Municípios', count: municipalities.length },
            { id: 'specials', label: 'Especiais', count: specials.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Editoriais */}
        {activeTab === 'editorials' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Gerenciar Editoriais</h3>
              <button
                onClick={handleSaveEditorial}
                className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Editorial
              </button>
            </div>

            {/* Formulário para novo editorial */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Editorial
                  </label>
                  <input
                    type="text"
                    value={newEditorial.name}
                    onChange={(e) => setNewEditorial({ ...newEditorial, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="Ex: POLÍTICA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cor
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newEditorial.color}
                      onChange={(e) => setNewEditorial({ ...newEditorial, color: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                    <div className="flex flex-wrap gap-1">
                      {colorOptions.slice(0, 6).map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewEditorial({ ...newEditorial, color })}
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSaveEditorial}
                    className="w-full bg-brand text-white py-2 px-4 rounded-md hover:bg-brand/90 transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de editoriais */}
            <div className="space-y-3">
              {editorials.map((editorial) => (
                <div
                  key={editorial.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: editorial.color }}
                    />
                    <span className="font-medium text-gray-900">{editorial.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEditorial(editorial.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Municípios */}
        {activeTab === 'municipalities' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Gerenciar Municípios</h3>
              <button
                onClick={handleSaveMunicipality}
                className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Município
              </button>
            </div>

            {/* Formulário para novo município */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Município
                  </label>
                  <input
                    type="text"
                    value={newMunicipality.name}
                    onChange={(e) => setNewMunicipality({ ...newMunicipality, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="Ex: PEDRO II"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cor
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newMunicipality.color}
                      onChange={(e) => setNewMunicipality({ ...newMunicipality, color: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                    <div className="flex flex-wrap gap-1">
                      {colorOptions.slice(0, 6).map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewMunicipality({ ...newMunicipality, color })}
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleSaveMunicipality}
                  className="bg-brand text-white py-2 px-4 rounded-md hover:bg-brand/90 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>

                         {/* Lista de municípios */}
             <div className="space-y-3">
               {municipalities.map((municipality) => (
                 <div
                   key={municipality.id}
                   className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                 >
                   <div className="flex items-center gap-3">
                     <div
                       className="w-4 h-4 rounded-full"
                       style={{ backgroundColor: municipality.color }}
                     />
                     <span className="font-medium text-gray-900">{municipality.name}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <button className="p-1 text-gray-400 hover:text-gray-600">
                       <Edit className="w-4 h-4" />
                     </button>
                     <button
                       onClick={() => handleDeleteMunicipality(municipality.id)}
                       className="p-1 text-gray-400 hover:text-red-600"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Especiais */}
        {activeTab === 'specials' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Gerenciar Especiais</h3>
              <button
                onClick={handleSaveSpecial}
                className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Especial
              </button>
            </div>

            {/* Formulário para novo especial */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Especial
                  </label>
                  <input
                    type="text"
                    value={newSpecial.name}
                    onChange={(e) => setNewSpecial({ ...newSpecial, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="Ex: EXCLUSIVO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cor
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newSpecial.color}
                      onChange={(e) => setNewSpecial({ ...newSpecial, color: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                    <div className="flex flex-wrap gap-1">
                      {colorOptions.slice(0, 6).map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewSpecial({ ...newSpecial, color })}
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSaveSpecial}
                    className="w-full bg-brand text-white py-2 px-4 rounded-md hover:bg-brand/90 transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de especiais */}
            <div className="space-y-3">
              {specials.map((special) => (
                <div
                  key={special.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: special.color }}
                    />
                    <span className="font-medium text-gray-900">{special.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSpecial(special.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManager; 