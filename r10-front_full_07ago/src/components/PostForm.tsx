// Nova versão sincronizada conforme descrito (não remove a antiga até validação)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  Save, Send, Tag, MapPin, Star, TrendingUp, Camera, X, Zap,
  CheckCircle, AlertCircle, RefreshCw, Sparkles, MessageSquare,
  Bell, Instagram, Mic, FileText, ArrowLeft
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import HatField from './HatField';
import AITagsGenerator from './AITagsGenerator';
import QuickSummary from './QuickSummary';
import { createPost, updatePost, getPostById } from '../services/postsService';
import { getAuthToken } from '../services/api';
import { reorganizePositionHierarchy } from '../utils/positionHierarchy';
import { useAuth } from '../contexts/AuthContext';
import { generateTitles, generateSubtitles, generateChapeus } from '../services/aiService';
import instagramAutomation from '../services/instagramAutomation';

// Mantém tipagem essencial
interface PostState { categoria:string; subcategoria:string; municipio:string; titulo:string; subtitulo:string; autor:string; fonte:string; chapéu:string; resumo:string; conteudo:string; imagemDestaque:string|null; posicao:string; agendamento:string|null; tags:string[]; whatsappAuto:boolean; pushAuto:boolean; igCardAuto:boolean; audioAuto:boolean; }
const igAutomation: any = instagramAutomation || { addToQueue:()=>{}, removeFromQueue:()=>{} };

const PostForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  const [autoSaving, setAutoSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState(['editoriais']);
  const [selectedSubcategories, setSelectedSubcategories] = useState(['geral']);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const [postId, setPostId] = useState<string|null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState({ titulos:[], subtitulos:[], chapeus:[] });

  const [post, setPost] = useState<PostState>({
    categoria:'geral', subcategoria:'geral', municipio:'', titulo:'', subtitulo:'', autor: user?.name||'', fonte:'', chapéu:'', resumo:'', conteudo:'', imagemDestaque:null, posicao:'geral', agendamento:null, tags:[], whatsappAuto:true, pushAuto:true, igCardAuto:false, audioAuto:false
  });

  useEffect(()=>{ if((post.titulo||post.conteudo)&&!id&&!loading){ setAutoSaving(true); const t=setTimeout(()=>{ setAutoSaving(false); handleSaveDraft(); },8000); return ()=>clearTimeout(t);} },[post.titulo,post.conteudo,post.subtitulo,post.resumo,id,loading]);
  useEffect(()=>{ setWordCount(post.conteudo.split(' ').filter(w=>w).length); },[post.conteudo]);

  const categoriasMaes:any = { 'editoriais':{ nome:'Editoriais', icon:FileText, subcategorias:[{value:'policia',label:'Polícia'},{value:'politica',label:'Política'},{value:'esporte',label:'Esporte'},{value:'entretenimento',label:'Entretenimento'},{value:'geral',label:'Geral'} ] }, 'municipios':{ nome:'Municípios', icon:MapPin, subcategorias:[{value:'piripiri',label:'Piripiri'},{value:'pedro-ii',label:'Pedro II'},{value:'brasileira',label:'Brasileira'},{value:'lagoa-de-sao-francisco',label:'Lagoa de São Francisco'},{value:'piracuruca',label:'Piracuruca'},{value:'sao-jose-do-divino',label:'São José do Divino'},{value:'domingos-mourao',label:'Domingos Mourão'},{value:'capitao-de-campos',label:'Capitão de Campos'},{value:'cocal-de-telha',label:'Cocal de Telha'},{value:'milton-brandao',label:'Milton Brandão'},{value:'teresina',label:'Teresina'},{value:'boa-hora',label:'Boa Hora'} ] }, 'especiais':{ nome:'Especiais', icon:Star, subcategorias:[{value:'investigacao',label:'Investigação'},{value:'series-especiais',label:'Séries Especiais'},{value:'entrevistas',label:'Entrevistas'},{value:'grandes-reportagens',label:'Grandes Reportagens'},{value:'documentarios',label:'Documentários'} ] } };

  useEffect(()=>{ const load=async()=>{ if(!id) return; setLoading(true); try{ const existing=await getPostById(id); if(existing){ setPostId(id); setPost(p=>({...p, categoria:existing.categoria, subcategoria:existing.categoria||'geral', titulo:existing.titulo, subtitulo:existing.subtitulo||'', autor:existing.autor, chapéu:existing.chapeu||'', resumo:existing.resumo||'', conteudo:existing.conteudo, imagemDestaque:existing.imagemUrl||null, posicao:existing.posicao||'geral'})); }}catch(e){ setError('Erro ao carregar'); } finally { setLoading(false);} }; load(); },[id]);

  const posicoes=[{value:'supermanchete',label:'Super Manchete',icon:Star},{value:'destaque',label:'Destaque',icon:TrendingUp},{value:'geral',label:'Geral',icon:FileText},{value:'municipios',label:'Municípios',icon:MapPin}];
  const isFormValid = post.titulo && post.conteudo && post.autor && selectedSubcategories.length>0; const isBlocked = saving || uploadingCover;

  const handleInputChange=(field:string,value:any)=>{ setPost(prev=>({...prev,[field]:value})); if(field==='igCardAuto'&&value===true&&post.titulo) igAutomation.addToQueue(postId||`draft_${Date.now()}`,post.titulo,post.chapéu); if(field==='igCardAuto'&&value===false&&postId) igAutomation.removeFromQueue(postId); };
  const generateSlug=(t:string)=> t.toLowerCase().replace(/[^\w\s]/g,'').replace(/\s+/g,'-');

  const mapCategoria=()=>{ if(selectedSubcategories.some(s=>['policia','politica','esporte','entretenimento','geral'].includes(s))){ if(selectedSubcategories.includes('policia'))return'policia'; if(selectedSubcategories.includes('politica'))return'politica'; if(selectedSubcategories.includes('esporte'))return'esporte'; if(selectedSubcategories.includes('entretenimento'))return'entretenimento'; return 'geral'; } if(selectedSubcategories.some(s=>['piripiri','pedro-ii','brasileira','lagoa-de-sao-francisco','piracuruca','sao-jose-do-divino','domingos-mourao','capitao-de-campos','cocal-de-telha','milton-brandao','teresina','boa-hora'].includes(s))) return 'municipios'; if(selectedSubcategories.some(s=>['investigacao','series-especiais','entrevistas','grandes-reportagens','documentarios'].includes(s))) return 'especiais'; return 'geral'; };
  const basePostPayload=(categoria:string)=>({ id:postId||undefined, titulo:post.titulo, subtitulo:post.subtitulo, autor:post.autor, conteudo:post.conteudo, chapeu:post.chapéu, categoria, posicao:post.posicao as any, dataPublicacao:new Date().toISOString(), imagemUrl:post.imagemDestaque });
  const successFlash=(m:string)=>{ setSuccess(m); setTimeout(()=>setSuccess(null),2500); };

  const handleSaveDraft=async()=>{ if(!post.titulo) return; try{ setSaving(true); setError(null); const cat=mapCategoria(); const data=basePostPayload(cat); const result=postId? await updatePost(postId,data): await createPost(data); if(!postId) setPostId(result.id); if(['supermanchete','destaque'].includes(post.posicao)) await reorganizePositionHierarchy(result.id, post.posicao as any); successFlash('Rascunho salvo!'); }catch(e){ setError('Erro ao salvar.'); } finally { setSaving(false);} };

  const ensureCoverUploadedIfBase64=async()=>{ if(post.imagemDestaque&&post.imagemDestaque.startsWith('data:')){ try{ const blob=await (await fetch(post.imagemDestaque)).blob(); const file=new File([blob],'capa-auto.png',{type:blob.type||'image/png'}); const fd=new FormData(); fd.append('image',file); setUploadingCover(true); const token=getAuthToken()||localStorage.getItem('token'); const headers=token?{ Authorization:`Bearer ${token}` }:{}; const resp=await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL||'/api'}/upload`,{method:'POST',headers,body:fd}); if(resp.ok){ const d=await resp.json(); handleInputChange('imagemDestaque', d.imageUrl || d.relativeUrl || d.relative || d.url); } }catch(e){ console.warn('Falha upload capa',e);} finally { setUploadingCover(false);} } };

  const handlePublish=async()=>{ if(!isFormValid) return; await ensureCoverUploadedIfBase64(); try{ setSaving(true); setError(null); const cat=mapCategoria(); const data=basePostPayload(cat); const result=postId? await updatePost(postId,data): await createPost(data); if(['supermanchete','destaque'].includes(post.posicao)) await reorganizePositionHierarchy(result.id, post.posicao as any); successFlash('Publicado!'); setTimeout(()=>navigate('/admin/materias'),1200); }catch(e){ setError('Erro ao publicar.'); } finally { setSaving(false);} };

  const toggleCategory=(c:string)=> setSelectedCategories(p=> p.includes(c)? p.filter(x=>x!==c): [...p,c]);
  const toggleSubcategory=(sub:string,categoriaKey:string)=>{ setSelectedSubcategories(prev=>{ const cat=categoriasMaes[categoriaKey]; const grupo=cat.subcategorias.map((s:any)=>s.value); const outras=prev.filter(s=>!grupo.includes(s)); return prev.includes(sub)? outras: [...outras, sub]; }); };

  const htmlToText=(html:string)=>{ const d=document.createElement('div'); d.innerHTML=html||''; d.querySelectorAll('p,br,div,h1,h2,h3,h4').forEach(e=>{ if(e.tagName==='BR') e.replaceWith('\n'); else { const t=e.textContent||''; if(t.trim()) e.replaceWith(t+'\n'); }}); return (d.textContent||'').trim(); };

  const handleGenerateAllAI=async()=>{ try{ if(!post.conteudo||post.conteudo.length<100){ setError('Mínimo 100 caracteres para IA'); return;} const texto=htmlToText(post.conteudo); if(texto.length<100){ setError('Texto insuficiente'); return;} setIsGeneratingAI(true); setError(null); const t=await generateTitles(texto,75,post.subtitulo,post.chapéu); const s=await generateSubtitles(texto,post.titulo,120,post.chapéu); const c=await generateChapeus(texto,20,post.titulo,post.subtitulo); setAiSuggestions({titulos:t,subtitulos:s,chapeus:c}); successFlash('Sugestões geradas!'); }catch(e){ setError('Erro IA'); } finally { setIsGeneratingAI(false);} };
  const applySuggestion=(type:string,val:string)=>{ handleInputChange(type,val); setTimeout(()=> setAiSuggestions({titulos:[],subtitulos:[],chapeus:[]}),1500); };

  if(loading) return <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>;

  return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 font-body">
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin?tab=materias" className="text-gray-600 hover:text-gray-900"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-lg font-bold">{id? 'Editando Matéria':'Nova Matéria'}</h1>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {autoSaving && <span className="text-green-600 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>Salvando...</span>}
          {saving && <span className="text-blue-600 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"/>Processando...</span>}
          {success && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />{success}</span>}
          {error && <span className="text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</span>}
          <button onClick={handleGenerateAllAI} disabled={isGeneratingAI||!post.conteudo||htmlToText(post.conteudo).length<100} className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full flex items-center gap-2 disabled:opacity-50">{isGeneratingAI?<RefreshCw className="w-3 h-3 animate-spin"/>:<Sparkles className="w-3 h-3"/>}IA</button>
          <button onClick={handleSaveDraft} className="px-3 py-1.5 border border-gray-300 rounded flex items-center gap-1"><Save className="w-3 h-3"/>Salvar</button>
          <button onClick={handlePublish} disabled={!isFormValid||isBlocked} className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded flex items-center gap-1 disabled:bg-gray-400"><Send className="w-3 h-3"/>Publicar</button>
        </div>
      </div>
    </div>
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="mb-4">
        <details className="bg-white rounded-lg border" open={!id}>
          <summary className="px-4 py-3 cursor-pointer font-medium flex items-center justify-between"><span className="flex items-center gap-2"><Tag className="w-4 h-4 text-blue-500"/>Categorização</span><span className="text-xs text-gray-500">{selectedSubcategories.length} selecionada(s)</span></summary>
          <div className="px-4 pb-4 space-y-3">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">{Object.entries(categoriasMaes).map(([key,cat]:any)=><button key={key} onClick={()=>toggleCategory(key)} className={`px-3 py-1.5 rounded-full border text-xs ${selectedCategories.includes(key)?'border-blue-500 bg-blue-50 text-blue-700':'border-gray-200 hover:border-blue-300 bg-white'}`}><cat.icon className="w-3 h-3"/>{cat.nome}</button>)}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{selectedCategories.map(key=>{ const cat=categoriasMaes[key]; return <div key={key} className="space-y-2"><h4 className="text-sm font-medium flex items-center gap-1"><cat.icon className="w-3 h-3"/>{cat.nome}</h4><div className="space-y-1">{cat.subcategorias.map((s:any)=><button key={s.value} onClick={()=>toggleSubcategory(s.value,key)} className={`w-full text-left px-3 py-1.5 rounded text-xs ${selectedSubcategories.includes(s.value)?'bg-green-100 text-green-800 border border-green-300':'bg-gray-50 hover:bg-green-50'}`}>{s.label}</button>)}</div></div>; })}</div>
            </div>
          </div>
        </details>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Título *</label>
              <input value={post.titulo} onChange={e=>handleInputChange('titulo', e.target.value)} maxLength={80} className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500" />
              <div className="flex justify-between mt-1 text-xs text-gray-500"><span>r10piaui.com.br/{generateSlug(post.titulo)||'titulo-da-materia'}</span><span>{post.titulo.length}/80</span></div>
              {aiSuggestions.titulos.length>0 && <div className="mt-2 p-2 bg-purple-50 rounded border"><div className="text-xs font-medium text-purple-800 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3"/>Sugestões</div><div className="space-y-1">{aiSuggestions.titulos.map((t:any,i:number)=><button key={i} onClick={()=>applySuggestion('titulo',t)} className="w-full text-left p-2 bg-white rounded border hover:border-purple-300 text-sm">{t}</button>)}</div></div>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Subtítulo *</label>
              <input value={post.subtitulo} onChange={e=>handleInputChange('subtitulo', e.target.value)} maxLength={120} className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500" />
              <div className="flex justify-between mt-1 text-xs text-gray-500"><span>Complementa o título</span><span>{post.subtitulo.length}/120</span></div>
              {aiSuggestions.subtitulos.length>0 && <div className="mt-2 p-2 bg-blue-50 rounded border"><div className="text-xs font-medium text-blue-800 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3"/>Sugestões</div><div className="space-y-1">{aiSuggestions.subtitulos.map((s:any,i:number)=><button key={i} onClick={()=>applySuggestion('subtitulo',s)} className="w-full text-left p-2 bg-white rounded border hover:border-blue-300 text-sm">{s}</button>)}</div></div>}
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3"><label className="text-sm font-medium">Conteúdo *</label><div className="flex items-center gap-3 text-xs text-gray-500"><span>{wordCount} palavras</span><span>~{Math.ceil(wordCount/200)} min</span></div></div>
            <RichTextEditor value={post.conteudo} onChange={v=>handleInputChange('conteudo', v)} placeholder="Digite o conteúdo da matéria aqui..." />
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Chapéu *</label>
              <HatField value={post.chapéu} onChange={v=>handleInputChange('chapéu', v)} isValid={post.chapéu.length>=3 && post.chapéu.length<=15} />
              {aiSuggestions.chapeus.length>0 && <div className="mt-2 p-2 bg-green-50 rounded border"><div className="text-xs font-medium text-green-800 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3"/>Chapéus</div><div className="flex flex-wrap gap-1">{aiSuggestions.chapeus.map((c:any,i:number)=><button key={i} onClick={()=>applySuggestion('chapéu', c)} className="px-2 py-1 bg-white rounded border hover:border-green-300 text-xs">{c}</button>)}</div></div>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Autor *</label>
              <select value={post.autor} onChange={e=>handleInputChange('autor', e.target.value)} className="w-full px-3 py-2 border rounded text-sm"><option value={user?.name||''}>{user?.name||'Selecione'}</option><option value="Redação R10 Piauí">Redação R10 Piauí</option></select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Posição na Home</label>
              <select value={post.posicao} onChange={e=>handleInputChange('posicao', e.target.value)} className="w-full px-3 py-2 border rounded text-sm">{posicoes.map(p=> <option key={p.value} value={p.value}>{p.label}</option>)}</select>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4"><h3 className="text-sm font-medium mb-3">Resumo</h3><QuickSummary value={post.resumo} onChange={v=>handleInputChange('resumo', v)} content={post.conteudo} /></div>
          <div className="bg-white rounded-lg border p-4"><h3 className="text-sm font-medium mb-3">Imagem de Destaque</h3><div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 cursor-pointer bg-gray-50" onClick={()=>document.getElementById('image-upload')?.click()}>{post.imagemDestaque? <div className="relative"><img src={post.imagemDestaque} alt="Preview" className="w-full h-48 object-cover rounded" /><button onClick={e=>{e.stopPropagation();handleInputChange('imagemDestaque', null);}} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X className="w-4 h-4"/></button></div> : <><Camera className="w-8 h-8 text-gray-400 mx-auto mb-2"/><p className="text-sm text-gray-600">Clique para enviar</p><p className="text-xs text-gray-500">JPG/PNG/WebP até 5MB</p></>}<input id="image-upload" type="file" className="hidden" accept="image/*" onChange={async e=>{ 
            const f=e.target.files?.[0]; 
            if(!f){ console.error('[PostForm] Nenhum arquivo selecionado'); return; }
            console.error('[PostForm] ========== INICIO UPLOAD ==========');
            console.error('[PostForm] Arquivo:', f.name, f.size, 'bytes');
            setUploadingCover(true); 
            const fd=new FormData(); 
            fd.append('image', f); 
            const token=getAuthToken()||localStorage.getItem('token'); 
            console.error('[PostForm] Token:', token ? 'PRESENTE' : 'AUSENTE');
            const headers=token?{ Authorization:`Bearer ${token}` }:{}; 
            try{ 
              console.error('[PostForm] Iniciando fetch para /api/upload...'); 
              const resp=await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL||'/api'}/upload`,{method:'POST',headers,body:fd}); 
              console.error('[PostForm] Status recebido:', resp.status, resp.statusText); 
              console.error('[PostForm] Headers resposta:', [...resp.headers.entries()]);
              const rawText = await resp.text();
              console.error('[PostForm] Resposta RAW (text):', rawText);
              let d;
              try {
                d = JSON.parse(rawText);
                console.error('[PostForm] Resposta JSON parseada:', d);
              } catch(parseErr) {
                console.error('[PostForm] ERRO ao parsear JSON:', parseErr);
                throw new Error('Resposta não é JSON válido');
              }
              if(resp.ok && d.imageUrl){ 
                console.error('[PostForm] ✅ Upload OK! URL:', d.imageUrl);
                handleInputChange('imagemDestaque', d.imageUrl); 
                successFlash('Imagem enviada!'); 
              }else{ 
                console.error('[PostForm] ❌ Upload falhou. resp.ok=', resp.ok, 'd.imageUrl=', d.imageUrl);
                setError('Falha no upload'); 
              } 
            }catch(err){ 
              console.error('[PostForm] ❌❌❌ EXCEPTION no upload:', err); 
              setError('Erro ao enviar imagem');
            } finally { 
              console.error('[PostForm] ========== FIM UPLOAD ==========');
              setUploadingCover(false);
            } 
          }} /></div>{uploadingCover && <p className="text-xs text-blue-600 mt-2 animate-pulse">📤 Enviando imagem...</p>}</div>
          <div className="bg-white rounded-lg border p-4"><details><summary className="cursor-pointer flex items-center gap-2"><Zap className="w-4 h-4 text-purple-500"/>Recursos Avançados</summary><div className="mt-3 space-y-4"><div><h4 className="text-sm font-medium mb-2">Tags com IA</h4><AITagsGenerator title={post.titulo} content={post.conteudo} tags={post.tags} onTagsChange={tags=>handleInputChange('tags', tags)} /></div><div><h4 className="text-sm font-medium mb-2">Agendamento</h4><input type="datetime-local" value={post.agendamento||''} onChange={e=>handleInputChange('agendamento', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />{post.agendamento && <p className="mt-1 text-xs text-gray-600">📅 {new Date(post.agendamento).toLocaleString('pt-BR')}</p>}</div><div><h4 className="text-sm font-medium mb-2">Distribuição</h4><div className="grid grid-cols-2 gap-2">{[{key:'whatsappAuto',icon:MessageSquare,title:'WhatsApp',color:'bg-green-500'},{key:'pushAuto',icon:Bell,title:'Push',color:'bg-blue-500'},{key:'igCardAuto',icon:Instagram,title:'Instagram',color:'bg-pink-500'},{key:'audioAuto',icon:Mic,title:'Áudio',color:'bg-purple-500'}].map(a=> <label key={a.key} className="flex items-center gap-2 p-2 border rounded cursor-pointer"><div className={`${a.color} p-1 rounded`}><a.icon className="w-3 h-3 text-white"/></div><span className="text-sm flex-1">{a.title}</span><input type="checkbox" checked={(post as any)[a.key]} onChange={e=>handleInputChange(a.key, e.target.checked)} /></label>)}</div></div></div></details></div>
        </div>
      </div>
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 -mx-4 shadow-lg"><div className="max-w-6xl mx-auto flex gap-2"><button onClick={handleSaveDraft} className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 px-3 rounded font-medium flex items-center justify-center gap-2 text-sm"><Save className="w-4 h-4"/>Salvar Rascunho</button><button onClick={handlePublish} disabled={!isFormValid||isBlocked} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-3 rounded font-medium flex items-center justify-center gap-2 text-sm"><Send className="w-4 h-4"/>{post.agendamento? 'Agendar':'Publicar'}</button></div></div>
    </div>
  </div>;
};

export default PostForm;