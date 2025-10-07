// PostForm - versão limpa unificada (baseada em PostForm.NEW.tsx)
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
import { reorganizePositionHierarchy } from '../utils/positionHierarchy';
import { useAuth } from '../contexts/AuthContext';
import { generateTitles, generateSubtitles, generateChapeus } from '../services/aiService';
import instagramAutomation from '../services/instagramAutomation';

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
  useEffect(()=>{ setWordCount(post.conteudo.split(/\s+/).filter(Boolean).length); },[post.conteudo]);

  const posicoes=[{value:'supermanchete',label:'Super Manchete',icon:Star},{value:'destaque',label:'Destaque',icon:TrendingUp},{value:'geral',label:'Geral',icon:FileText},{value:'municipios',label:'Municípios',icon:MapPin}];
  const isFormValid=!!(post.titulo&&post.conteudo&&post.autor&&selectedSubcategories.length>0); const isBlocked=saving||uploadingCover;
  const handleInputChange=(field:string,value:any)=>{ setPost(prev=>({...prev,[field]:value})); if(field==='igCardAuto'&&value===true&&post.titulo) igAutomation.addToQueue(postId||`draft_${Date.now()}`,post.titulo,post.chapéu); if(field==='igCardAuto'&&value===false&&postId) igAutomation.removeFromQueue(postId); };
  const generateSlug=(t:string)=>t.toLowerCase().replace(/[^\w\s]/g,'').replace(/\s+/g,'-');
  const mapCategoria=()=>{ const s=selectedSubcategories; if(s.some(x=>['policia','politica','esporte','entretenimento','geral'].includes(x))){ if(s.includes('policia'))return'policia'; if(s.includes('politica'))return'politica'; if(s.includes('esporte'))return'esporte'; if(s.includes('entretenimento'))return'entretenimento'; return 'geral'; } if(s.some(x=>['piripiri','pedro-ii','brasileira','lagoa-de-sao-francisco','piracuruca','sao-jose-do-divino','domingos-mourao','capitao-de-campos','cocal-de-telha','milton-brandao','teresina','boa-hora'].includes(x))) return 'municipios'; if(s.some(x=>['investigacao','series-especiais','entrevistas','grandes-reportagens','documentarios'].includes(x))) return 'especiais'; return 'geral'; };
  const basePostPayload=(categoria:string)=>({ id:postId||undefined, titulo:post.titulo, subtitulo:post.subtitulo, autor:post.autor, conteudo:post.conteudo, chapeu:post.chapéu, resumo:post.resumo, categoria, posicao:post.posicao as any, dataPublicacao:new Date().toISOString(), imagemUrl:post.imagemDestaque });
  const successFlash=(m:string)=>{ setSuccess(m); setTimeout(()=>setSuccess(null),2500); };
  const handleSaveDraft=async()=>{ if(!post.titulo) return; try{ setSaving(true); setError(null); const cat=mapCategoria(); const data=basePostPayload(cat); const result=postId? await updatePost(postId,data): await createPost(data); if(!postId) setPostId(result.id); if(['supermanchete','destaque'].includes(post.posicao)) await reorganizePositionHierarchy(result.id, post.posicao as any); successFlash('Rascunho salvo'); }catch(e){ setError('Erro ao salvar'); } finally { setSaving(false);} };
  const ensureCoverUploadedIfBase64=async()=>{ if(post.imagemDestaque&&post.imagemDestaque.startsWith('data:')){ try{ const blob=await (await fetch(post.imagemDestaque)).blob(); const file=new File([blob],'capa-auto.png',{type:blob.type||'image/png'}); const fd=new FormData(); fd.append('image',file); setUploadingCover(true); const token=localStorage.getItem('token'); const resp=await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL||'/api'}/upload`,{method:'POST',headers:{'Authorization':`Bearer ${token}`},body:fd}); if(resp.ok){ const d=await resp.json(); handleInputChange('imagemDestaque', d.imageUrl||d.relativeUrl||d.url);} }catch(e){ console.warn('Falha upload capa',e);} finally { setUploadingCover(false);} } };
  const handlePublish=async()=>{ if(!isFormValid) return; await ensureCoverUploadedIfBase64(); try{ setSaving(true); setError(null); const cat=mapCategoria(); const data=basePostPayload(cat); const result=postId? await updatePost(postId,data): await createPost(data); if(['supermanchete','destaque'].includes(post.posicao)) await reorganizePositionHierarchy(result.id, post.posicao as any); successFlash('Publicado!'); setTimeout(()=>navigate('/admin/materias'),1200); }catch(e){ setError('Erro ao publicar'); } finally { setSaving(false);} };
  const toggleCategory=(c:string)=> setSelectedCategories(p=> p.includes(c)? p.filter(x=>x!==c): [...p,c]);
  const toggleSubcategory=(sub:string,k:string)=>{ setSelectedSubcategories(prev=>{ const grupo=categoriasMaes[k].subcategorias.map((s:any)=>s.value); const outras=prev.filter(s=>!grupo.includes(s)); return prev.includes(sub)? outras:[...outras,sub]; }); };
  const htmlToText=(html:string)=>{ const d=document.createElement('div'); d.innerHTML=html||''; d.querySelectorAll('p,br,div,h1,h2,h3,h4').forEach(e=>{ if(e.tagName==='BR') e.replaceWith('\n'); else { const t=e.textContent||''; if(t.trim()) e.replaceWith(t+'\n'); }}); return (d.textContent||'').trim(); };
  const handleGenerateAllAI=async()=>{ try{ if(!post.conteudo||post.conteudo.length<100){ setError('Mínimo 100 caracteres para IA'); return;} const texto=htmlToText(post.conteudo); if(texto.length<100){ setError('Texto insuficiente'); return;} setIsGeneratingAI(true); setError(null); const t=await generateTitles(texto,75,post.subtitulo,post.chapéu); const s=await generateSubtitles(texto,post.titulo,120,post.chapéu); const c=await generateChapeus(texto,20,post.titulo,post.subtitulo); setAiSuggestions({titulos:t,subtitulos:s,chapeus:c}); successFlash('Sugestões geradas'); }catch(e){ setError('Erro IA'); } finally { setIsGeneratingAI(false);} };
  const applySuggestion=(type:string,val:string)=>{ handleInputChange(type,val); setTimeout(()=> setAiSuggestions({titulos:[],subtitulos:[],chapeus:[]}),1500); };
  if(loading) return <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>;
  return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 font-body"><div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50"><div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between"><div className="flex items-center gap-3"><Link to="/admin?tab=materias" className="text-gray-600 hover:text-gray-900"><ArrowLeft className="w-5 h-5" /></Link><h1 className="text-lg font-bold">{id? 'Editando Matéria':'Nova Matéria'}</h1></div><div className="flex items-center gap-2 text-xs">{autoSaving && <span className="text-green-600 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>Salvando...</span>}{saving && <span className="text-blue-600 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"/>Processando...</span>}{success && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />{success}</span>}{error && <span className="text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</span>}<button onClick={handleGenerateAllAI} disabled={isGeneratingAI||!post.conteudo||htmlToText(post.conteudo).length<100} className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full flex items-center gap-2 disabled:opacity-50">{isGeneratingAI?<RefreshCw className="w-3 h-3 animate-spin"/>:<Sparkles className="w-3 h-3"/>}IA</button><button onClick={handleSaveDraft} className="px-3 py-1.5 border border-gray-300 rounded flex items-center gap-1"><Save className="w-3 h-3"/>Salvar</button><button onClick={handlePublish} disabled={!isFormValid||isBlocked} className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded flex items-center gap-1 disabled:bg-gray-400"><Send className="w-3 h-3"/>{post.agendamento? 'Agendar':'Publicar'}</button></div></div></div><div className="max-w-6xl mx-auto px-4 py-4"><div className="mb-4"><details className="bg-white rounded-lg border" open={!id}><summary className="px-4 py-3 cursor-pointer font-medium flex items-center justify-between"><span className="flex items-center gap-2"><Tag className="w-4 h-4 text-blue-500"/>Categorização</span><span className="text-xs text-gray-500">{selectedSubcategories.length} selecionada(s)</span></summary><div className="px-4 pb-4 space-y-3"><div><div className="flex flex-wrap gap-2 mb-3">{Object.entries(categoriasMaes).map(([key,cat]:any)=><button key={key} onClick={()=>toggleCategory(key)} className={`px-3 py-1.5 rounded-full border text-xs ${selectedCategories.includes(key)?'border-blue-500 bg-blue-50 text-blue-700':'border-gray-200 hover:border-blue-300 bg-white'}`}><cat.icon className="w-3 h-3"/>{cat.nome}</button>)}</div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{selectedCategories.map(key=>{ const cat=categoriasMaes[key]; return <div key={key} className="space-y-2"><h4 className="text-sm font-medium flex items-center gap-1"><cat.icon className="w-3 h-3"/>{cat.nome}</h4><div className="space-y-1">{cat.subcategorias.map((s:any)=><button key={s.value} onClick={()=>toggleSubcategory(s.value,key)} className={`w-full text-left px-3 py-1.5 rounded text-xs ${selectedSubcategories.includes(s.value)?'bg-green-100 text-green-800 border border-green-300':'bg-gray-50 hover:bg-green-50'}`}>{s.label}</button>)}</div></div>; })}</div></div></div></details></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4"><div className="lg:col-span-2 space-y-4"><div className="bg-white rounded-lg border p-4 space-y-4"><div><label className="block text-sm font-medium mb-2">Título *</label><input value={post.titulo} onChange={e=>handleInputChange('titulo', e.target.value)} maxLength={80} className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500" /><div className="flex justify-between mt-1 text-xs text-gray-500"><span>r10piaui.com.br/{generateSlug(post.titulo)||'titulo-da-materia'}</span><span>{post.titulo.length}/80</span></div>{aiSuggestions.titulos.length>0 && <div className="mt-2 p-2 bg-purple-50 rounded border"><div className="text-xs font-medium text-purple-800 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3"/>Sugestões</div><div className="space-y-1">{aiSuggestions.titulos.map((t:any,i:number)=><button key={i} onClick={()=>applySuggestion('titulo',t)} className="w-full text-left p-2 bg-white rounded border hover:border-purple-300 text-sm">{t}</button>)}</div></div>}</div><div><label className="block text-sm font-medium mb-2">Subtítulo *</label><input value={post.subtitulo} onChange={e=>handleInputChange('subtitulo', e.target.value)} maxLength={120} className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500" /><div className="flex justify-between mt-1 text-xs text-gray-500"><span>Complementa o título</span><span>{post.subtitulo.length}/120</span></div>{aiSuggestions.subtitulos.length>0 && <div className="mt-2 p-2 bg-blue-50 rounded border"><div className="text-xs font-medium text-blue-800 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3"/>Sugestões</div><div className="space-y-1">{aiSuggestions.subtitulos.map((s:any,i:number)=><button key={i} onClick={()=>applySuggestion('subtitulo',s)} className="w-full text-left p-2 bg-white rounded border hover:border-blue-300 text-sm">{s}</button>)}</div></div>}</div></div><div className="bg-white rounded-lg border p-4"><div className="flex items-center justify-between mb-3"><label className="text-sm font-medium">Conteúdo *</label><div className="flex items-center gap-3 text-xs text-gray-500"><span>{wordCount} palavras</span><span>~{Math.ceil(wordCount/200)} min</span></div></div><RichTextEditor value={post.conteudo} onChange={v=>handleInputChange('conteudo', v)} placeholder="Digite o conteúdo da matéria aqui..." /></div></div><div className="space-y-4"><div className="bg-white rounded-lg border p-4 space-y-3"><div><label className="block text-xs font-medium mb-1">Chapéu *</label><HatField value={post.chapéu} onChange={v=>handleInputChange('chapéu', v)} isValid={post.chapéu.length>=3 && post.chapéu.length<=15} />{aiSuggestions.chapeus.length>0 && <div className="mt-2 p-2 bg-green-50 rounded border"><div className="text-xs font-medium text-green-800 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3"/>Chapéus</div><div className="flex flex-wrap gap-1">{aiSuggestions.chapeus.map((c:any,i:number)=><button key={i} onClick={()=>applySuggestion('chapéu', c)} className="px-2 py-1 bg-white rounded border hover:border-green-300 text-xs">{c}</button>)}</div></div>}</div><div><label className="block text-xs font-medium mb-1">Autor *</label><select value={post.autor} onChange={e=>handleInputChange('autor', e.target.value)} className="w-full px-3 py-2 border rounded text-sm"><option value={user?.name||''}>{user?.name||'Selecione'}</option><option value="Redação R10 Piauí">Redação R10 Piauí</option></select></div><div><label className="block text-xs font-medium mb-1">Posição na Home</label><select value={post.posicao} onChange={e=>handleInputChange('posicao', e.target.value)} className="w-full px-3 py-2 border rounded text-sm">{posicoes.map(p=> <option key={p.value} value={p.value}>{p.label}</option>)}</select></div></div><div className="bg-white rounded-lg border p-4"><h3 className="text-sm font-medium mb-3">Resumo</h3><QuickSummary value={post.resumo} onChange={v=>handleInputChange('resumo', v)} content={post.conteudo} /></div><div className="bg-white rounded-lg border p-4"><h3 className="text-sm font-medium mb-3">Imagem de Destaque</h3><div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 cursor-pointer bg-gray-50" onClick={()=>document.getElementById('image-upload')?.click()}> {post.imagemDestaque? <div className="relative"><img src={post.imagemDestaque} alt="Preview" className="w-full h-48 object-cover rounded" /><button onClick={e=>{e.stopPropagation();handleInputChange('imagemDestaque', null);}} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X className="w-4 h-4"/></button></div> : <><Camera className="w-8 h-8 text-gray-400 mx-auto mb-2"/><p className="text-sm text-gray-600">Clique para enviar</p><p className="text-xs text-gray-500">JPG/PNG/WebP até 5MB</p></>}<input id="image-upload" type="file" className="hidden" accept="image/*" onChange={async e=>{ const f=e.target.files?.[0]; if(!f)return; const reader=new FileReader(); reader.onload=ev=>handleInputChange('imagemDestaque', ev.target?.result as string); reader.readAsDataURL(f); const fd=new FormData(); fd.append('image', f); const token=localStorage.getItem('token'); try{ const resp=await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL||'/api'}/upload`,{method:'POST',headers:{'Authorization':`Bearer ${token}`},body:fd}); if(resp.ok){ const d=await resp.json(); handleInputChange('imagemDestaque', d.imageUrl);} }catch(err){ console.error('Upload falhou',err);} }} /></div></div><div className="bg-white rounded-lg border p-4"><details><summary className="cursor-pointer flex items-center gap-2"><Zap className="w-4 h-4 text-purple-500"/>Recursos Avançados</summary><div className="mt-3 space-y-4"><div><h4 className="text-sm font-medium mb-2">Tags com IA</h4><AITagsGenerator title={post.titulo} content={post.conteudo} tags={post.tags} onTagsChange={tags=>handleInputChange('tags', tags)} /></div><div><h4 className="text-sm font-medium mb-2">Agendamento</h4><input type="datetime-local" value={post.agendamento||''} onChange={e=>handleInputChange('agendamento', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />{post.agendamento && <p className="mt-1 text-xs text-gray-600">📅 {new Date(post.agendamento).toLocaleString('pt-BR')}</p>}</div><div><h4 className="text-sm font-medium mb-2">Distribuição</h4><div className="grid grid-cols-2 gap-2">{[{key:'whatsappAuto',icon:MessageSquare,title:'WhatsApp',color:'bg-green-500'},{key:'pushAuto',icon:Bell,title:'Push',color:'bg-blue-500'},{key:'igCardAuto',icon:Instagram,title:'Instagram',color:'bg-pink-500'},{key:'audioAuto',icon:Mic,title:'Áudio',color:'bg-purple-500'}].map(a=> <label key={a.key} className="flex items-center gap-2 p-2 border rounded cursor-pointer"><div className={`${a.color} p-1 rounded`}><a.icon className="w-3 h-3 text-white"/></div><span className="text-sm flex-1">{a.title}</span><input type="checkbox" checked={(post as any)[a.key]} onChange={e=>handleInputChange(a.key, e.target.checked)} /></label> )}</div></div></div></details></div></div></div><div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 -mx-4 shadow-lg"><div className="max-w-6xl mx-auto flex gap-2"><button onClick={handleSaveDraft} className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 px-3 rounded font-medium flex items-center justify-center gap-2 text-sm"><Save className="w-4 h-4"/>Salvar Rascunho</button><button onClick={handlePublish} disabled={!isFormValid||isBlocked} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-3 rounded font-medium flex items-center justify-center gap-2 text-sm"><Send className="w-4 h-4"/>{post.agendamento? 'Agendar':'Publicar'}</button></div></div></div></div>;
  const categoriasMaes:any = { 'editoriais':{ nome:'Editoriais', icon:FileText, subcategorias:[{value:'policia',label:'Polícia'},{value:'politica',label:'Política'},{value:'esporte',label:'Esporte'},{value:'entretenimento',label:'Entretenimento'},{value:'geral',label:'Geral'} ] }, 'municipios':{ nome:'Municípios', icon:MapPin, subcategorias:[{value:'piripiri',label:'Piripiri'},{value:'pedro-ii',label:'Pedro II'},{value:'brasileira',label:'Brasileira'},{value:'lagoa-de-sao-francisco',label:'Lagoa de São Francisco'},{value:'piracuruca',label:'Piracuruca'},{value:'sao-jose-do-divino',label:'São José do Divino'},{value:'domingos-mourao',label:'Domingos Mourão'},{value:'capitao-de-campos',label:'Capitão de Campos'},{value:'cocal-de-telha',label:'Cocal de Telha'},{value:'milton-brandao',label:'Milton Brandão'},{value:'teresina',label:'Teresina'},{value:'boa-hora',label:'Boa Hora'} ] }, 'especiais':{ nome:'Especiais', icon:Star, subcategorias:[{value:'investigacao',label:'Investigação'},{value:'series-especiais',label:'Séries Especiais'},{value:'entrevistas',label:'Entrevistas'},{value:'grandes-reportagens',label:'Grandes Reportagens'},{value:'documentarios',label:'Documentários'} ] } };

  useEffect(()=>{ const load=async()=>{ if(!id) return; setLoading(true); try{ const existing=await getPostById(id); if(existing){ setPostId(id); setPost(p=>({...p, categoria:existing.categoria, subcategoria:existing.categoria||'geral', titulo:existing.titulo, subtitulo:existing.subtitulo||'', autor:existing.autor, chapéu:existing.chapeu||'', resumo:existing.resumo||'', conteudo:existing.conteudo, imagemDestaque:existing.imagemUrl||null, posicao:existing.posicao||'geral'})); }}catch(e){ setError('Erro ao carregar'); } finally { setLoading(false);} }; load(); },[id]);

  const posicoes=[{value:'supermanchete',label:'Super Manchete',icon:Star},{value:'destaque',label:'Destaque',icon:TrendingUp},{value:'geral',label:'Geral',icon:FileText},{value:'municipios',label:'Municípios',icon:MapPin}];
  const isFormValid = !!(post.titulo && post.conteudo && post.autor && selectedSubcategories.length>0); const isBlocked = saving || uploadingCover;

  const handleInputChange=(field:string,value:any)=>{ setPost(prev=>({...prev,[field]:value})); if(field==='igCardAuto'&&value===true&&post.titulo) igAutomation.addToQueue(postId||`draft_${Date.now()}`,post.titulo,post.chapéu); if(field==='igCardAuto'&&value===false&&postId) igAutomation.removeFromQueue(postId); };
  const generateSlug=(t:string)=> t.toLowerCase().replace(/[^\w\s]/g,'').replace(/\s+/g,'-');

  const mapCategoria=()=>{ if(selectedSubcategories.some(s=>['policia','politica','esporte','entretenimento','geral'].includes(s))){ if(selectedSubcategories.includes('policia'))return'policia'; if(selectedSubcategories.includes('politica'))return'politica'; if(selectedSubcategories.includes('esporte'))return'esporte'; if(selectedSubcategories.includes('entretenimento'))return'entretenimento'; return 'geral'; } if(selectedSubcategories.some(s=>['piripiri','pedro-ii','brasileira','lagoa-de-sao-francisco','piracuruca','sao-jose-do-divino','domingos-mourao','capitao-de-campos','cocal-de-telha','milton-brandao','teresina','boa-hora'].includes(s))) return 'municipios'; if(selectedSubcategories.some(s=>['investigacao','series-especiais','entrevistas','grandes-reportagens','documentarios'].includes(s))) return 'especiais'; return 'geral'; };
  const basePostPayload=(categoria:string)=>({ id:postId||undefined, titulo:post.titulo, subtitulo:post.subtitulo, autor:post.autor, conteudo:post.conteudo, chapeu:post.chapéu, categoria, posicao:post.posicao as any, dataPublicacao:new Date().toISOString(), imagemUrl:post.imagemDestaque });
  const successFlash=(m:string)=>{ setSuccess(m); setTimeout(()=>setSuccess(null),2500); };

  const handleSaveDraft=async()=>{ if(!post.titulo) return; try{ setSaving(true); setError(null); const cat=mapCategoria(); const data=basePostPayload(cat); const result=postId? await updatePost(postId,data): await createPost(data); if(!postId) setPostId(result.id); if(['supermanchete','destaque'].includes(post.posicao)) await reorganizePositionHierarchy(result.id, post.posicao as any); successFlash('Rascunho salvo!'); }catch(e){ setError('Erro ao salvar.'); } finally { setSaving(false);} };

  const ensureCoverUploadedIfBase64=async()=>{ if(post.imagemDestaque&&post.imagemDestaque.startsWith('data:')){ try{ const blob=await (await fetch(post.imagemDestaque)).blob(); const file=new File([blob],'capa-auto.png',{type:blob.type||'image/png'}); const fd=new FormData(); fd.append('image',file); setUploadingCover(true); const token=localStorage.getItem('token'); const resp=await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL||'/api'}/upload`,{method:'POST',headers:{'Authorization':`Bearer ${token}`},body:fd}); if(resp.ok){ const d=await resp.json(); handleInputChange('imagemDestaque', d.imageUrl || d.relativeUrl || d.relative || d.url); } }catch(e){ console.warn('Falha upload capa',e);} finally { setUploadingCover(false);} } };

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
          <div className="bg-white rounded-lg border p-4"><h3 className="text-sm font-medium mb-3">Imagem de Destaque</h3><div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 cursor-pointer bg-gray-50" onClick={()=>document.getElementById('image-upload')?.click()}>{post.imagemDestaque? <div className="relative"><img src={post.imagemDestaque} alt="Preview" className="w-full h-48 object-cover rounded" /><button onClick={e=>{e.stopPropagation();handleInputChange('imagemDestaque', null);}} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X className="w-4 h-4"/></button></div> : <><Camera className="w-8 h-8 text-gray-400 mx-auto mb-2"/><p className="text-sm text-gray-600">Clique para enviar</p><p className="text-xs text-gray-500">JPG/PNG/WebP até 5MB</p></>}<input id="image-upload" type="file" className="hidden" accept="image/*" onChange={async e=>{ const f=e.target.files?.[0]; if(!f)return; const reader=new FileReader(); reader.onload=ev=>handleInputChange('imagemDestaque', ev.target?.result as string); reader.readAsDataURL(f); const fd=new FormData(); fd.append('image', f); const token=localStorage.getItem('token'); try{ const resp=await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL||'/api'}/upload`,{method:'POST',headers:{'Authorization':`Bearer ${token}`},body:fd}); if(resp.ok){ const d=await resp.json(); handleInputChange('imagemDestaque', d.imageUrl);} }catch(err){ console.error('Upload falhou',err);} }} /></div></div>
          <div className="bg-white rounded-lg border p-4"><details><summary className="cursor-pointer flex items-center gap-2"><Zap className="w-4 h-4 text-purple-500"/>Recursos Avançados</summary><div className="mt-3 space-y-4"><div><h4 className="text-sm font-medium mb-2">Tags com IA</h4><AITagsGenerator title={post.titulo} content={post.conteudo} tags={post.tags} onTagsChange={tags=>handleInputChange('tags', tags)} /></div><div><h4 className="text-sm font-medium mb-2">Agendamento</h4><input type="datetime-local" value={post.agendamento||''} onChange={e=>handleInputChange('agendamento', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />{post.agendamento && <p className="mt-1 text-xs text-gray-600">📅 {new Date(post.agendamento).toLocaleString('pt-BR')}</p>}</div><div><h4 className="text-sm font-medium mb-2">Distribuição</h4><div className="grid grid-cols-2 gap-2">{[{key:'whatsappAuto',icon:MessageSquare,title:'WhatsApp',color:'bg-green-500'},{key:'pushAuto',icon:Bell,title:'Push',color:'bg-blue-500'},{key:'igCardAuto',icon:Instagram,title:'Instagram',color:'bg-pink-500'},{key:'audioAuto',icon:Mic,title:'Áudio',color:'bg-purple-500'}].map(a=> <label key={a.key} className="flex items-center gap-2 p-2 border rounded cursor-pointer"><div className={`${a.color} p-1 rounded`}><a.icon className="w-3 h-3 text-white"/></div><span className="text-sm flex-1">{a.title}</span><input type="checkbox" checked={(post as any)[a.key]} onChange={e=>handleInputChange(a.key, e.target.checked)} /></label>)}</div></div></div></details></div>
        </div>
      </div>
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 -mx-4 shadow-lg"><div className="max-w-6xl mx-auto flex gap-2"><button onClick={handleSaveDraft} className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 px-3 rounded font-medium flex items-center justify-center gap-2 text-sm"><Save className="w-4 h-4"/>Salvar Rascunho</button><button onClick={handlePublish} disabled={!isFormValid||isBlocked} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-3 rounded font-medium flex items-center justify-center gap-2 text-sm"><Send className="w-4 h-4"/>{post.agendamento? 'Agendar':'Publicar'}</button></div></div>
    </div>
  </div>;
};

export default PostForm;
// Substituído pelo conteúdo validado (base PostForm.NEW)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Save, Send, Tag, MapPin, Star, TrendingUp, Camera, X, Zap, CheckCircle, AlertCircle, RefreshCw, Sparkles, MessageSquare, Bell, Instagram, Mic, FileText, ArrowLeft } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import HatField from './HatField';
import AITagsGenerator from './AITagsGenerator';
import QuickSummary from './QuickSummary';
import { createPost, updatePost, getPostById } from '../services/postsService';
import { reorganizePositionHierarchy } from '../utils/positionHierarchy';
import { useAuth } from '../contexts/AuthContext';
import { generateTitles, generateSubtitles, generateChapeus } from '../services/aiService';
import instagramAutomation from '../services/instagramAutomation';

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

  const ensureCoverUploadedIfBase64=async()=>{ if(post.imagemDestaque&&post.imagemDestaque.startsWith('data:')){ try{ const blob=await (await fetch(post.imagemDestaque)).blob(); const file=new File([blob],'capa-auto.png',{type:blob.type||'image/png'}); const fd=new FormData(); fd.append('image',file); setUploadingCover(true); const token=localStorage.getItem('token'); const resp=await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL||'/api'}/upload`,{method:'POST',headers:{'Authorization':`Bearer ${token}`},body:fd}); if(resp.ok){ const d=await resp.json(); handleInputChange('imagemDestaque', d.imageUrl || d.relativeUrl || d.relative || d.url); } }catch(e){ console.warn('Falha upload capa',e);} finally { setUploadingCover(false);} } };

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
          <div className="bg-white rounded-lg border p-4"><h3 className="text-sm font-medium mb-3">Imagem de Destaque</h3><div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 cursor-pointer bg-gray-50" onClick={()=>document.getElementById('image-upload')?.click()}> {post.imagemDestaque? <div className="relative"><img src={post.imagemDestaque} alt="Preview" className="w-full h-48 object-cover rounded" /><button onClick={e=>{e.stopPropagation();handleInputChange('imagemDestaque', null);}} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X className="w-4 h-4"/></button></div> : <><Camera className="w-8 h-8 text-gray-400 mx-auto mb-2"/><p className="text-sm text-gray-600">Clique para enviar</p><p className="text-xs text-gray-500">JPG/PNG/WebP até 5MB</p></>}<input id="image-upload" type="file" className="hidden" accept="image/*" onChange={async e=>{ const f=e.target.files?.[0]; if(!f)return; const reader=new FileReader(); reader.onload=ev=>handleInputChange('imagemDestaque', ev.target?.result as string); reader.readAsDataURL(f); const fd=new FormData(); fd.append('image', f); const token=localStorage.getItem('token'); try{ const resp=await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL||'/api'}/upload`,{method:'POST',headers:{'Authorization':`Bearer ${token}`},body:fd}); if(resp.ok){ const d=await resp.json(); handleInputChange('imagemDestaque', d.imageUrl);} }catch(err){ console.error('Upload falhou',err);} }} /></div></div>
          <div className="bg-white rounded-lg border p-4"><details><summary className="cursor-pointer flex items-center gap-2"><Zap className="w-4 h-4 text-purple-500"/>Recursos Avançados</summary><div className="mt-3 space-y-4"><div><h4 className="text-sm font-medium mb-2">Tags com IA</h4><AITagsGenerator title={post.titulo} content={post.conteudo} tags={post.tags} onTagsChange={tags=>handleInputChange('tags', tags)} /></div><div><h4 className="text-sm font-medium mb-2">Agendamento</h4><input type="datetime-local" value={post.agendamento||''} onChange={e=>handleInputChange('agendamento', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />{post.agendamento && <p className="mt-1 text-xs text-gray-600">📅 {new Date(post.agendamento).toLocaleString('pt-BR')}</p>}</div><div><h4 className="text-sm font-medium mb-2">Distribuição</h4><div className="grid grid-cols-2 gap-2">{[{key:'whatsappAuto',icon:MessageSquare,title:'WhatsApp',color:'bg-green-500'},{key:'pushAuto',icon:Bell,title:'Push',color:'bg-blue-500'},{key:'igCardAuto',icon:Instagram,title:'Instagram',color:'bg-pink-500'},{key:'audioAuto',icon:Mic,title:'Áudio',color:'bg-purple-500'}].map(a=> <label key={a.key} className="flex items-center gap-2 p-2 border rounded cursor-pointer"><div className={`${a.color} p-1 rounded`}><a.icon className="w-3 h-3 text-white"/></div><span className="text-sm flex-1">{a.title}</span><input type="checkbox" checked={(post as any)[a.key]} onChange={e=>handleInputChange(a.key, e.target.checked)} /></label> )}</div></div></div></details></div>
        </div>
      </div>
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 -mx-4 shadow-lg"><div className="max-w-6xl mx-auto flex gap-2"><button onClick={handleSaveDraft} className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 px-3 rounded font-medium flex items-center justify-center gap-2 text-sm"><Save className="w-4 h-4"/>Salvar Rascunho</button><button onClick={handlePublish} disabled={!isFormValid||isBlocked} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-3 rounded font-medium flex items-center justify-center gap-2 text-sm"><Send className="w-4 h-4"/>{post.agendamento? 'Agendar':'Publicar'}</button></div></div>
    </div>
  </div>;
  </div>; // fecha container principal
};

export default PostForm;
// LIMPO: implementação final unificada
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Save, Send, Tag, MapPin, Star, TrendingUp, Camera, X, Zap, CheckCircle, AlertCircle, RefreshCw, Sparkles, MessageSquare, Bell, Instagram, Mic, FileText, ArrowLeft } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import HatField from './HatField';
import AITagsGenerator from './AITagsGenerator';
import QuickSummary from './QuickSummary';
import { createPost, updatePost, getPostById } from '../services/postsService';
import { reorganizePositionHierarchy } from '../utils/positionHierarchy';
import { useAuth } from '../contexts/AuthContext';
import { generateTitles, generateSubtitles, generateChapeus } from '../services/aiService';
import instagramAutomation from '../services/instagramAutomation';

interface PostState { categoria:string; subcategoria:string; municipio:string; titulo:string; subtitulo:string; autor:string; fonte:string; chapéu:string; resumo:string; conteudo:string; imagemDestaque:string|null; posicao:string; agendamento:string|null; tags:string[]; whatsappAuto:boolean; pushAuto:boolean; igCardAuto:boolean; audioAuto:boolean; }
const igAutomation: any = instagramAutomation || { addToQueue:()=>{}, removeFromQueue:()=>{} };

const PostForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  const [autoSaving, setAutoSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(['editoriais']);
  const [selectedSubcategories, setSelectedSubcategories] = useState(['geral']);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState({
    titulos: [],
    subtitulos: [],
    chapeus: []
  });
  const [uploadingCover, setUploadingCover] = useState(false); // controle de upload da capa
  
  const [post, setPost] = useState({
    const categoriasMaes:any = { 'editoriais':{ nome:'Editoriais', icon:FileText, subcategorias:[{value:'policia',label:'Polícia'},{value:'politica',label:'Política'},{value:'esporte',label:'Esporte'},{value:'entretenimento',label:'Entretenimento'},{value:'geral',label:'Geral'} ] }, 'municipios':{ nome:'Municípios', icon:MapPin, subcategorias:[{value:'piripiri',label:'Piripiri'},{value:'pedro-ii',label:'Pedro II'},{value:'brasileira',label:'Brasileira'},{value:'lagoa-de-sao-francisco',label:'Lagoa de São Francisco'},{value:'piracuruca',label:'Piracuruca'},{value:'sao-jose-do-divino',label:'São José do Divino'},{value:'domingos-mourao',label:'Domingos Mourão'},{value:'capitao-de-campos',label:'Capitão de Campos'},{value:'cocal-de-telha',label:'Cocal de Telha'},{value:'milton-brandao',label:'Milton Brandão'},{value:'teresina',label:'Teresina'},{value:'boa-hora',label:'Boa Hora'} ] }, 'especiais':{ nome:'Especiais', icon:Star, subcategorias:[{value:'investigacao',label:'Investigação'},{value:'series-especiais',label:'Séries Especiais'},{value:'entrevistas',label:'Entrevistas'},{value:'grandes-reportagens',label:'Grandes Reportagens'},{value:'documentarios',label:'Documentários'} ] } };
    'editoriais': {
      nome: 'Editoriais',
      icon: FileText,
      color: 'bg-blue-500',
      subcategorias: [
        { value: 'policia', label: 'Polícia' },
        { value: 'politica', label: 'Política' },
        { value: 'esporte', label: 'Esporte' },
        { value: 'entretenimento', label: 'Entretenimento' },
        { value: 'geral', label: 'Geral' }
      ]
    },
    'municipios': {
      nome: 'Municípios',
      icon: MapPin,
      color: 'bg-green-500',
      subcategorias: [
        { value: 'piripiri', label: 'Piripiri' },
        { value: 'pedro-ii', label: 'Pedro II' },
        { value: 'brasileira', label: 'Brasileira' },
        { value: 'lagoa-de-sao-francisco', label: 'Lagoa de São Francisco' },
        { value: 'piracuruca', label: 'Piracuruca' },
        { value: 'sao-jose-do-divino', label: 'São José do Divino' },
        { value: 'domingos-mourao', label: 'Domingos Mourão' },
        { value: 'capitao-de-campos', label: 'Capitão de Campos' },
        { value: 'cocal-de-telha', label: 'Cocal de Telha' },
        { value: 'milton-brandao', label: 'Milton Brandão' },
        { value: 'teresina', label: 'Teresina' },
        { value: 'boa-hora', label: 'Boa Hora' }
      ]
    },
    'especiais': {
      nome: 'Especiais',
      icon: Star,
      color: 'bg-purple-500',
      subcategorias: [
        { value: 'investigacao', label: 'Investigação' },
        { value: 'series-especiais', label: 'Séries Especiais' },
        { value: 'entrevistas', label: 'Entrevistas' },
        { value: 'grandes-reportagens', label: 'Grandes Reportagens' },
        { value: 'documentarios', label: 'Documentários' }
      ]
    }
  };

  // Load existing post for editing
  useEffect(() => {
    const loadExistingPost = async () => {
      if (id) {
        setLoading(true);
        console.log('Carregando post com ID:', id);
        try {
          const existingPost = await getPostById(id);
          console.log('🔍 [POST FORM] Post da API:', existingPost);
          console.log('🔍 [POST FORM] Título:', existingPost?.titulo);
          console.log('🔍 [POST FORM] Conteúdo:', existingPost?.conteudo?.substring(0, 100));
          console.log('🔍 [POST FORM] Resumo:', existingPost?.resumo);
          if (existingPost) {
          setPostId(id);
          setPost({
            categoria: existingPost.categoria,
            subcategoria: existingPost.categoria || 'geral', // MySQL não tem subcategorias
            municipio: '',
            titulo: existingPost.titulo,
            subtitulo: existingPost.subtitulo || '',
            autor: existingPost.autor,
            fonte: '', // MySQL não tem campo fonte
            chapéu: existingPost.chapeu || '',
            resumo: existingPost.resumo || '', // Campo resumo EXISTE no banco SQLite
            conteudo: existingPost.conteudo,
            imagemDestaque: existingPost.imagemUrl || null,
            posicao: existingPost.posicao || 'geral',
            agendamento: null, // MySQL não tem agendamento
            tags: [], // MySQL não tem tags
            whatsappAuto: true,
            pushAuto: true,
            igCardAuto: false,
            audioAuto: false
          });

          // Update selected categories based on categoria from MySQL
          if (existingPost.categoria) {
            // Mapear categoria do MySQL para as categorias do formulário
            const categoria = existingPost.categoria.toLowerCase();
            if (categoria.includes('polici') || categoria.includes('segur')) {
              setSelectedCategories(['editoriais']);
              setSelectedSubcategories(['policia']);
            } else if (categoria.includes('politic')) {
              setSelectedCategories(['editoriais']);
              setSelectedSubcategories(['politica']);
            } else if (categoria.includes('esport')) {
              setSelectedCategories(['editoriais']);
              setSelectedSubcategories(['esporte']);
            } else {
              setSelectedCategories(['editoriais']);
              setSelectedSubcategories(['geral']);
            }
          }
         }
       } catch (error) {
         console.error('Erro ao carregar post:', error);
         setError('Erro ao carregar matéria para edição');
       } finally {
         setLoading(false);
       }
     }
   };

   loadExistingPost();
 }, [id]);

  const posicoes = [
    { 
      value: 'supermanchete', 
      label: 'Super Manchete', 
      icon: Star,
      description: 'Destaque principal da página'
    },
    { 
      value: 'destaque', 
      label: 'Destaque', 
      icon: TrendingUp,
      description: 'Seção de destaques'
    },
    { 
      value: 'geral', 
      label: 'Geral', 
      icon: FileText,
      description: 'Seção de notícias gerais'
    },
    { 
      value: 'municipios', 
      label: 'Municípios', 
      icon: MapPin,
      description: 'Seção de municípios'
    }
  ];

  const autores = [
    'João Silva',
    'Maria Santos',
    'Pedro Oliveira',
    'Ana Costa',
    'Carlos Ferreira',
    'Lucia Rodrigues'
  ];

  // (Removido duplicata de isFormValid/isBlocked)

  const handleInputChange = (field, value) => {
    setPost(prev => ({ ...prev, [field]: value }));
    
    // Se o Instagram foi marcado, adicionar à fila de automação
    if (field === 'igCardAuto' && value === true && post.titulo) {
      instagramAutomation.addToQueue(
        postId || `draft_${Date.now()}`, 
        post.titulo, 
        post.chapéu
      );
    }
    
    // Se o Instagram foi desmarcado, remover da fila
    if (field === 'igCardAuto' && value === false && postId) {
      instagramAutomation.removeFromQueue(postId);
    }
  };

  const generateSlug = (titulo) => {
    return titulo
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
  };

  const addTag = (tagText) => {
    if (tagText && !post.tags.includes(tagText)) {
      setPost(prev => ({ ...prev, tags: [...prev.tags, tagText] }));
    }
  };

  const removeTag = (tagToRemove) => {
    setPost(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  // Salvar como rascunho
  const handleSaveDraft = async () => {
    if (!post.titulo) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Mapear subcategorias selecionadas para categoria final
      let categoria = 'geral'; // padrão
      
      if (selectedSubcategories.includes('policia')) {
        categoria = 'policia';
      } else if (selectedSubcategories.includes('politica')) {
        categoria = 'politica';
      } else if (selectedSubcategories.includes('esporte')) {
        categoria = 'esporte';
      } else if (selectedSubcategories.includes('entretenimento')) {
        categoria = 'entretenimento';
      } else if (selectedSubcategories.includes('geral')) {
        categoria = 'geral';
      } else if (selectedSubcategories.some(sub => ['piripiri', 'pedro-ii', 'brasileira', 'lagoa-de-sao-francisco', 'piracuruca', 'sao-jose-do-divino', 'domingos-mourao', 'capitao-de-campos', 'cocal-de-telha', 'milton-brandao', 'teresina', 'boa-hora'].includes(sub))) {
        categoria = 'municipios';
      } else if (selectedSubcategories.some(sub => ['investigacao', 'series-especiais', 'entrevistas', 'grandes-reportagens', 'documentarios'].includes(sub))) {
        categoria = 'especiais';
      }
      
      console.log('🔍 [DRAFT DEBUG] Subcategorias selecionadas:', selectedSubcategories);
      console.log('🎯 [DRAFT DEBUG] Categoria final escolhida:', categoria);
      
      const postData = {
        id: postId || undefined,
        titulo: post.titulo,
        subtitulo: post.subtitulo,
        autor: post.autor,
        conteudo: post.conteudo,
        chapeu: post.chapéu,
        categoria: categoria,
        posicao: post.posicao as 'supermanchete' | 'destaque' | 'geral' | 'municipios',
        dataPublicacao: new Date().toISOString(),
        imagemUrl: post.imagemDestaque
      };
      
      let result;
      if (postId) {
        result = await updatePost(postId, postData);
      } else {
        result = await createPost(postData);
        setPostId(result.id);
      }

      // ❌ REMOVIDO: Reorganização já é feita no backend automaticamente
      
      setSuccess('Rascunho salvo com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erro ao salvar rascunho:', err);
      setError('Erro ao salvar rascunho. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const ensureCoverUploadedIfBase64 = async () => {
    if (post.imagemDestaque && typeof post.imagemDestaque === 'string' && post.imagemDestaque.startsWith('data:')) {
      try {
        const blob = await (await fetch(post.imagemDestaque)).blob();
        const file = new File([blob], 'capa-auto.png', { type: blob.type || 'image/png' });
        const formData = new FormData();
        formData.append('image', file);
        setUploadingCover(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL || '/api'}/upload`, {
          method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (response.ok) {
          const data = await response.json();
          handleInputChange('imagemDestaque', data.imageUrl || data.relativeUrl || data.relative || data.url);
        }
      } catch (e) {
        console.warn('Falha upload automático capa base64:', e);
      } finally {
        setUploadingCover(false);
      }
    }
  };

  const handlePublish = async () => {
    if (!isFormValid) return;
    await ensureCoverUploadedIfBase64();
    
    try {
      setSaving(true);
      setError(null);
      
      // Mapear subcategorias selecionadas para categoria final
      let categoria = 'geral'; // padrão
      
      if (selectedSubcategories.includes('policia')) {
        categoria = 'policia';
      } else if (selectedSubcategories.includes('politica')) {
        categoria = 'politica';
      } else if (selectedSubcategories.includes('esporte')) {
        categoria = 'esporte';
      } else if (selectedSubcategories.includes('entretenimento')) {
        categoria = 'entretenimento';
      } else if (selectedSubcategories.includes('geral')) {
        categoria = 'geral';
      } else if (selectedSubcategories.some(sub => ['piripiri', 'pedro-ii', 'brasileira', 'lagoa-de-sao-francisco', 'piracuruca', 'sao-jose-do-divino', 'domingos-mourao', 'capitao-de-campos', 'cocal-de-telha', 'milton-brandao', 'teresina', 'boa-hora'].includes(sub))) {
        categoria = 'municipios';
      } else if (selectedSubcategories.some(sub => ['investigacao', 'series-especiais', 'entrevistas', 'grandes-reportagens', 'documentarios'].includes(sub))) {
        categoria = 'especiais';
      }
      
      console.log('🔍 [PUBLISH DEBUG] Subcategorias selecionadas:', selectedSubcategories);
      console.log(`📝 [FRONTEND] Enviando resumo: ${post.resumo ? post.resumo.substring(0, 50) + '...' : 'VAZIO'}`);
      
      const postData = {
        id: postId || undefined,
        titulo: post.titulo,
        subtitulo: post.subtitulo,
        autor: post.autor,
        conteudo: post.conteudo,
        chapeu: post.chapéu,
        resumo: post.resumo, // ✅ RESUMO INCLUÍDO!
        categoria: categoria,
        posicao: post.posicao as 'supermanchete' | 'destaque' | 'geral' | 'municipios',
        dataPublicacao: new Date().toISOString(),
        imagemUrl: post.imagemDestaque
      };
      
      console.log('💾 Salvando post com posição:', post.posicao);
      console.log('📋 Post data completo:', postData);
      
      let result;
      if (postId) {
        result = await updatePost(postId, postData);
      } else {
        result = await createPost(postData);
      }

      // ❌ REMOVIDO: Reorganização já é feita no backend automaticamente
      
      setSuccess('Matéria publicada com sucesso!');
      setTimeout(() => {
        navigate('/admin/materias');
      }, 1500);
    } catch (err) {
      console.error('Erro ao publicar matéria:', err);
      setError('Erro ao publicar matéria. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleSubcategory = (subcategory, categoriaKey) => {
    setSelectedSubcategories(prev => {
      // Remove qualquer subcategoria da mesma categoria-mãe
      const categoria = categoriasMaes[categoriaKey];
      const subcategoriasDaCategoria = categoria.subcategorias.map(sc => sc.value);
      const outrasSubcategorias = prev.filter(sc => !subcategoriasDaCategoria.includes(sc));
      
      // Se a subcategoria já está selecionada, remove ela
      if (prev.includes(subcategory)) {
        return outrasSubcategorias;
      }
      
      // Se não está selecionada, adiciona ela (substituindo qualquer outra da mesma categoria)
      return [...outrasSubcategorias, subcategory];
    });
  };

  const clearAllSelections = () => {
    setSelectedCategories(['editoriais']);
    setSelectedSubcategories(['geral']);
  };

  // Função utilitária para converter HTML para texto puro
  const htmlToText = (html: string): string => {
    if (!html) {
      console.log('⚠️ HTML vazio recebido');
      return '';
    }
    
    console.log('🔧 Convertendo HTML para texto:', html.substring(0, 100) + '...');
    
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      console.log('📄 HTML parseado, elementos encontrados:', tempDiv.children.length);
      
      // Substituir elementos de bloco por quebras de linha
      const blockElements = tempDiv.querySelectorAll('p, br, div, h1, h2, h3, h4, h5, h6');
      console.log('🔄 Elementos de bloco encontrados:', blockElements.length);
      
      blockElements.forEach((el, index) => {
        console.log(`🔄 Processando elemento ${index + 1}:`, el.tagName, el.textContent?.substring(0, 50));
        if (el.tagName === 'BR') {
          el.replaceWith('\n');
        } else {
          const textContent = el.textContent || '';
          if (textContent.trim()) {  // Só adiciona quebra se há conteúdo
            el.replaceWith(textContent + '\n');
          }
        }
      });
      
      const finalText = (tempDiv.textContent || tempDiv.innerText || '').trim();
      console.log('✅ Texto final extraído:', finalText.substring(0, 100) + '...');
      console.log('📏 Tamanho do texto final:', finalText.length);
      
      return finalText;
    } catch (error) {
      console.error('❌ Erro ao converter HTML para texto:', error);
      // Fallback: tentar remover tags HTML de forma simples
      const fallbackText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log('🔄 Usando fallback, resultado:', fallbackText.substring(0, 100) + '...');
      return fallbackText;
    }
  };

  // Função para gerar todas as sugestões de IA de uma vez
  const handleGenerateAllAI = async () => {
    try {
      console.log('🚨 FUNÇÃO handleGenerateAllAI CHAMADA - INÍCIO');
      console.log('🤖 Iniciando geração de IA...');
      console.log('📝 Conteúdo original (HTML):', post.conteudo);
      console.log('📝 Conteúdo length:', post.conteudo?.length);
      
      if (!post.conteudo || post.conteudo.length < 100) {
        const errorMsg = 'Escreva pelo menos 100 caracteres no conteúdo para gerar sugestões de IA';
        console.log('❌ Erro:', errorMsg);
        setError(errorMsg);
        return;
      }

      console.log('✅ Validação inicial passou');

      // Converter HTML para texto puro para enviar para a IA
      console.log('🔧 Iniciando conversão HTML para texto...');
      const textoPuro = htmlToText(post.conteudo).trim();
      console.log('✅ Conversão HTML para texto concluída');
      
      console.log('📄 Texto puro extraído completo:', textoPuro);
      console.log('📄 Texto puro (primeiros 200 chars):', textoPuro.substring(0, 200) + '...');
      console.log('📏 Tamanho do texto puro:', textoPuro.length);
      console.log('🔍 Verificando se texto é válido:', textoPuro.length >= 100);

      if (textoPuro.length < 100) {
        const errorMsg = `O conteúdo deve ter pelo menos 100 caracteres de texto (sem formatação). Atual: ${textoPuro.length} caracteres.`;
        console.log('❌ Erro:', errorMsg);
        setError(errorMsg);
        return;
      }

      console.log('✅ Validação do texto puro passou');

      setIsGeneratingAI(true);
      setError(null);
      console.log('🔄 Estado de geração ativado');

      console.log('📡 Preparando para fazer chamadas para IA...');
      console.log('🔍 Verificando imports das funções de IA...');
      console.log('🔍 generateTitles existe?', typeof generateTitles);
      console.log('🔍 generateSubtitles existe?', typeof generateSubtitles);
      console.log('🔍 generateChapeus existe?', typeof generateChapeus);

      try {
        console.log('📡 Fazendo chamadas para IA com texto:', textoPuro.substring(0, 100) + '...');
        
        console.log('🎯 Chamando generateTitles...');
        const titulosSuggestions = await generateTitles(textoPuro, 75, post.subtitulo, post.chapéu);
        console.log('✅ generateTitles retornou:', titulosSuggestions);

        console.log('🎯 Chamando generateSubtitles...');
        const subtitulosSuggestions = await generateSubtitles(textoPuro, post.titulo, 120, post.chapéu);
        console.log('✅ generateSubtitles retornou:', subtitulosSuggestions);

        console.log('🎯 Chamando generateChapeus...');
        const chapeusSuggestions = await generateChapeus(textoPuro, 20, post.titulo, post.subtitulo);
        console.log('✅ generateChapeus retornou:', chapeusSuggestions);

        console.log('✅ Todas as sugestões recebidas:');
        console.log('- Títulos:', titulosSuggestions);
        console.log('- Subtítulos:', subtitulosSuggestions);
        console.log('- Chapéus:', chapeusSuggestions);

        // Verificar se as sugestões não são genéricas
        const hasGenericSuggestions = 
          titulosSuggestions.some(t => t.includes('Título Sugerido') || t.includes('Novo Desenvolvimento')) ||
          subtitulosSuggestions.some(s => s.includes('Entenda os principais')) ||
          chapeusSuggestions.some(c => c.includes('NOTÍCIAS') || c.includes('DESTAQUE'));

        if (hasGenericSuggestions) {
          console.warn('⚠️ Sugestões genéricas detectadas - possível problema na API');
        }

        setAiSuggestions({
          titulos: titulosSuggestions,
          subtitulos: subtitulosSuggestions,
          chapeus: chapeusSuggestions
        });

        console.log('✅ Estado das sugestões atualizado');

        setSuccess('Sugestões de IA geradas com sucesso!');
        setTimeout(() => setSuccess(null), 3000);
        
      } catch (apiError) {
        console.error('❌ Erro específico nas chamadas de IA:', apiError);
        console.error('❌ Stack trace:', apiError.stack);
        throw apiError;
      }

    } catch (err) {
      console.error('❌ Erro geral na função handleGenerateAllAI:', err);
      console.error('❌ Tipo do erro:', typeof err);
      console.error('❌ Stack trace completo:', err.stack);
      setError(`Erro ao gerar sugestões de IA: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setIsGeneratingAI(false);
      console.log('🔄 Estado de geração desativado - FINAL DA FUNÇÃO');
    }
  };

  // Função para aplicar sugestão
  const applySuggestion = (type: string, value: string) => {
    handleInputChange(type, value);
    // Limpar sugestões após aplicar
    setTimeout(() => {
      setAiSuggestions({
        titulos: [],
        subtitulos: [],
        chapeus: []
      });
    }, 2000);
  };

  // Se estiver carregando, mostrar indicador
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 font-body flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando matéria para edição...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 font-body">
      {/* Header Simplificado */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/admin?tab=materias" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {id ? 'Editando Matéria' : 'Nova Matéria'}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Status indicators mais discretos */}
              {autoSaving && !id && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  Salvando...
                </span>
              )}
              {saving && (
                <span className="text-xs text-blue-600 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                  Processando...
                </span>
              )}
              {success && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {success}
                </span>
              )}
              {error && (
                <span className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </span>
              )}
              
              {/* Botão único de IA */}
              <button
                onClick={handleGenerateAllAI}
                disabled={isGeneratingAI || !post.conteudo || htmlToText(post.conteudo).trim().length < 100}
                className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm rounded-full hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                title={(() => {
                  if (!post.conteudo) return 'Escreva o conteúdo da matéria primeiro';
                  const textoLimpo = htmlToText(post.conteudo).trim();
                  const caracteresTexto = textoLimpo.length;
                  const caracteresHTML = post.conteudo.length;
                  return `Gerar sugestões de IA\nConteúdo HTML: ${caracteresHTML} chars\nTexto limpo: ${caracteresTexto} chars\nMínimo necessário: 100 chars\nStatus: ${caracteresTexto >= 100 ? '✅ Pronto' : '❌ Insuficiente'}`;
                })()}
              >
                {isGeneratingAI ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Gerando IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    IA Sugestões
                  </>
                )}
              </button>
              
              {/* Botões de ação mais limpos */}
              <button 
                onClick={handleSaveDraft}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded text-sm flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                Salvar
              </button>
              <button 
                onClick={handlePublish}
                disabled={!isFormValid || saving || uploadingCover}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-1.5 rounded flex items-center gap-1 font-medium text-sm transition-colors"
              >
                <Send className="w-3 h-3" />
                Publicar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Container principal com layout otimizado */}
      <div className="max-w-6xl mx-auto px-4 py-4">
         
         {/* Seção 1: Categorização (Colapsável) */}
         <div className="mb-4">
           <details className="bg-white rounded-lg shadow-sm border border-gray-200" open={!id}>
             <summary className="px-4 py-3 cursor-pointer hover:bg-gray-50 font-medium text-gray-900 flex items-center justify-between">
               <span className="flex items-center gap-2">
                 <Tag className="w-4 h-4 text-blue-500" />
                 Categorização
               </span>
               <span className="text-xs text-gray-500">
                 {selectedSubcategories.length > 0 ? `${selectedSubcategories.length} selecionada(s)` : 'Clique para configurar'}
               </span>
             </summary>
             
             <div className="px-4 pb-4 space-y-3">
               {/* Filtros de Categorias em linha */}
               <div>
                 <div className="flex flex-wrap gap-2 mb-3">
                   {Object.entries(categoriasMaes).map(([key, categoria]) => (
                     <button
                       key={key}
                       onClick={() => toggleCategory(key)}
                       className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1.5 ${
                         selectedCategories.includes(key)
                           ? 'border-blue-500 bg-blue-50 text-blue-700'
                           : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 bg-white text-gray-700'
                       }`}
                     >
                       <categoria.icon className="w-3 h-3" />
                       {categoria.nome}
                     </button>
                   ))}
                 </div>

                 {/* Subcategorias organizadas */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                   {selectedCategories.map(categoriaKey => {
                     const categoria = categoriasMaes[categoriaKey];
                     return (
                       <div key={categoriaKey} className="space-y-2">
                         <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                           <categoria.icon className="w-3 h-3" />
                           {categoria.nome}
                         </h4>
                         <div className="space-y-1">
                           {categoria.subcategorias.map(subcat => (
                             <button
                               key={subcat.value}
                               onClick={() => toggleSubcategory(subcat.value, categoriaKey)}
                               className={`w-full text-left px-3 py-1.5 rounded text-xs transition-all ${
                                 selectedSubcategories.includes(subcat.value)
                                   ? 'bg-green-100 text-green-800 border border-green-300'
                                   : 'bg-gray-50 hover:bg-green-50 text-gray-700 border border-transparent'
                               }`}
                             >
                               {subcat.label}
                             </button>
                           ))}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
             </div>
           </details>
         </div>

         {/* Seção 2: Conteúdo Principal (Sempre visível) */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
           
           {/* Coluna Principal - Título, Subtítulo, Conteúdo */}
           <div className="lg:col-span-2 space-y-4">
             
             {/* Título e Subtítulo em um card */}
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
               <div className="space-y-4">
                 {/* Título */}
                 <div>
                   <label className="block text-sm font-medium text-gray-900 mb-2">
                     Título <span className="text-red-500">*</span>
                   </label>
                   <input
                     type="text"
                     value={post.titulo}
                     onChange={(e) => handleInputChange('titulo', e.target.value)}
                     placeholder="Digite um título chamativo e claro"
                     className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base transition-all ${
                       post.titulo.length >= 10 && post.titulo.length <= 80
                         ? 'border-green-300 bg-green-50' 
                         : post.titulo 
                           ? 'border-red-300 bg-red-50' 
                           : 'border-gray-300'
                     }`}
                     maxLength={80}
                   />
                   <div className="flex justify-between mt-1 text-xs text-gray-500">
                     <span>r10piaui.com.br/{generateSlug(post.titulo) || 'titulo-da-materia'}</span>
                     <span className={post.titulo.length > 70 ? 'text-red-600' : ''}>
                       {post.titulo.length}/80
                     </span>
                   
                   {/* Sugestões de Títulos */}
                   {aiSuggestions.titulos.length > 0 && (
                     <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                       <div className="text-xs font-medium text-purple-800 mb-2 flex items-center gap-1">
                         <Sparkles className="w-3 h-3" />
                         Sugestões de Títulos
                       </div>
                       <div className="space-y-1">
                         {aiSuggestions.titulos.map((titulo, index) => (
                           <button
                             key={index}
                             onClick={() => applySuggestion('titulo', titulo)}
                             className="w-full text-left p-2 bg-white rounded border hover:border-purple-300 transition-colors text-sm"
                           >
                             {titulo}
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>

                 {/* Subtítulo */}
                 <div>
                   <label className="block text-sm font-medium text-gray-900 mb-2">
                     Subtítulo <span className="text-red-500">*</span>
                   </label>
                   <input
                     type="text"
                     value={post.subtitulo}
                     onChange={(e) => handleInputChange('subtitulo', e.target.value)}
                     placeholder="Digite um subtítulo para complementar o título"
                     className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base transition-all ${
                       post.subtitulo.length >= 15 && post.subtitulo.length <= 120
                         ? 'border-green-300 bg-green-50' 
                         : post.subtitulo 
                           ? 'border-red-300 bg-red-50' 
                           : 'border-gray-300'
                     }`}
                     maxLength={120}
                   />
                   <div className="flex justify-between mt-1 text-xs text-gray-500">
                     <span>Complementa o título principal</span>
                     <span className={post.subtitulo.length > 100 ? 'text-red-600' : ''}>
                       {post.subtitulo.length}/120
                     </span>
                   
                   {/* Sugestões de Subtítulos */}
                   {aiSuggestions.subtitulos.length > 0 && (
                     <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                       <div className="text-xs font-medium text-blue-800 mb-2 flex items-center gap-1">
                         <Sparkles className="w-3 h-3" />
                         Sugestões de Subtítulos
                       </div>
                       <div className="space-y-1">
                         {aiSuggestions.subtitulos.map((subtitulo, index) => (
                           <button
                             key={index}
                             onClick={() => applySuggestion('subtitulo', subtitulo)}
                             className="w-full text-left p-2 bg-white rounded border hover:border-blue-300 transition-colors text-sm"
                           >
                             {subtitulo}
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             </div>

             {/* Editor de Conteúdo */}
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
               <div className="flex items-center justify-between mb-3">
                 <label className="text-sm font-medium text-gray-900">
                   Conteúdo da Matéria <span className="text-red-500">*</span>
                 </label>
                 <div className="flex items-center gap-3 text-xs text-gray-500">
                   <span>{wordCount} palavras</span>
                   <span>~{Math.ceil(wordCount / 200)} min</span>
                 </div>
               </div>
               
               <RichTextEditor
                 value={post.conteudo}
                 onChange={(value) => handleInputChange('conteudo', value)}
                 placeholder="Digite o conteúdo da matéria aqui..."
               />
             </div>
           </div>

           {/* Coluna Lateral - Metadados */}
           <div className="space-y-4">
             
             {/* Chapéu, Autor, Fonte */}
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
               <h3 className="text-sm font-medium text-gray-900 mb-3">Informações Básicas</h3>
               <div className="space-y-3">
                 
                 {/* Chapéu */}
                 <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">
                     Chapéu <span className="text-red-500">*</span>
                   </label>
                   <HatField
                     value={post.chapéu}
                     onChange={(value) => handleInputChange('chapéu', value)}
                     isValid={post.chapéu.length >= 3 && post.chapéu.length <= 15}
                   />
                   
                   {/* Sugestões de Chapéus */}
                   {aiSuggestions.chapeus.length > 0 && (
                     <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                       <div className="text-xs font-medium text-green-800 mb-2 flex items-center gap-1">
                         <Sparkles className="w-3 h-3" />
                         Sugestões de Chapéus
                       </div>
                       <div className="flex flex-wrap gap-1">
                         {aiSuggestions.chapeus.map((chapeu, index) => (
                           <button
                             key={index}
                             onClick={() => applySuggestion('chapéu', chapeu)}
                             className="px-2 py-1 bg-white rounded border hover:border-green-300 transition-colors text-xs font-medium"
                           >
                             {chapeu}
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>

                 {/* Autor */}
                 <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">
                     Autor <span className="text-red-500">*</span>
                   </label>
                   <select 
                     value={post.autor}
                     onChange={(e) => handleInputChange('autor', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                   >
                     <option value={user?.name || ''}>{user?.name || 'Selecione'}</option>
                     <option value="Redação R10 Piauí">Redação R10 Piauí</option>
                   </select>
                 </div>

                 {/* Fonte */}
                 <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">Fonte</label>
                   <input
                     type="text"
                     value={post.fonte}
                     onChange={(e) => handleInputChange('fonte', e.target.value)}
                     placeholder="Ex: Agência Brasil"
                     className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                   />
                 </div>

                 {/* Posição */}
                 <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">Posição na Home</label>
                   <select
                     value={post.posicao}
                     onChange={(e) => handleInputChange('posicao', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                   >
                     {posicoes.map(posicao => (
                       <option key={posicao.value} value={posicao.value}>
                         {posicao.label}
                       </option>
                     ))}
                   </select>
                 </div>
               </div>
             </div>

             {/* Resumo */}
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
               <h3 className="text-sm font-medium text-gray-900 mb-3">Resumo</h3>
               <QuickSummary
                 value={post.resumo}
                 onChange={(value) => handleInputChange('resumo', value)}
                 content={post.conteudo}
               />
             </div>

             {/* Imagem */}
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
               <h3 className="text-sm font-medium text-gray-900 mb-3">Imagem de Destaque</h3>
               <div 
                 className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors cursor-pointer bg-gray-50"
                 onClick={() => document.getElementById('image-upload')?.click()}
               >
                 {post.imagemDestaque ? (
                   <div className="relative">
                     <img 
                       src={post.imagemDestaque} 
                       alt="Preview" 
                       className="w-full h-48 object-cover rounded-lg"
                     />
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         handleInputChange('imagemDestaque', null);
                       }}
                       className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                 ) : (
                   <>
                     <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                     <p className="text-sm text-gray-600">Clique para fazer upload</p>
                     <p className="text-xs text-gray-500">JPG, PNG, WebP - Máx. 5MB</p>
                   </>
                 )}
                 <input 
                   id="image-upload"
                   type="file" 
                   className="hidden" 
                   accept="image/*"
                   onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       const reader = new FileReader();
                       reader.onload = (event) => {
                         handleInputChange('imagemDestaque', event.target?.result as string);
                       };
                       reader.readAsDataURL(file);
                     }
                   }}
                 />
               </div>
             </div>
           </div>
         </div>

         {/* Seção 3: Recursos Avançados (Colapsável) */}
         <div className="mb-4">
           <details className="bg-white rounded-lg shadow-sm border border-gray-200">
             <summary className="px-4 py-3 cursor-pointer hover:bg-gray-50 font-medium text-gray-900 flex items-center justify-between">
               <span className="flex items-center gap-2">
                 <Zap className="w-4 h-4 text-purple-500" />
                 Recursos Avançados
               </span>
               <span className="text-xs text-gray-500">Tags, Distribuição, Agendamento</span>
             </summary>
             
             <div className="px-4 pb-4">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 
                 {/* Tags */}
                 <div>
                   <h4 className="text-sm font-medium text-gray-900 mb-2">Tags com IA</h4>
                   <AITagsGenerator
                     title={post.titulo}
                     content={post.conteudo}
                     tags={post.tags}
                     onTagsChange={(tags) => handleInputChange('tags', tags)}
                   />
                 </div>

                 {/* Agendamento */}
                 <div>
                   <h4 className="text-sm font-medium text-gray-900 mb-2">Agendamento</h4>
                   <input
                     type="datetime-local"
                     value={post.agendamento || ''}
                     onChange={(e) => handleInputChange('agendamento', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                   />
                   {post.agendamento && (
                     <p className="mt-1 text-xs text-gray-600">
                       📅 Será publicado em: {new Date(post.agendamento).toLocaleString('pt-BR')}
                     </p>
                   )}
                 </div>
               </div>

               {/* Distribuição Automática */}
               <div className="mt-4">
                 <h4 className="text-sm font-medium text-gray-900 mb-2">Distribuição Automática</h4>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                   {[
                     { key: 'whatsappAuto', icon: MessageSquare, title: 'WhatsApp', color: 'bg-green-500' },
                     { key: 'pushAuto', icon: Bell, title: 'Push', color: 'bg-blue-500' },
                     { key: 'igCardAuto', icon: Instagram, title: 'Instagram', color: 'bg-pink-500' },
                     { key: 'audioAuto', icon: Mic, title: 'Áudio', color: 'bg-purple-500' }
                   ].map(automation => (
                     <label key={automation.key} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                       <div className={`${automation.color} p-1 rounded`}>
                         <automation.icon className="w-3 h-3 text-white" />
                       </div>
                       <span className="text-sm flex-1">{automation.title}</span>
                       <input
                         type="checkbox"
                         checked={post[automation.key]}
                         onChange={(e) => handleInputChange(automation.key, e.target.checked)}
                         className="rounded"
                       />
                     </label>
                   ))}
                 </div>
               </div>
             </div>
           </details>
         </div>

         {/* Botões de ação fixos */}
         <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 -mx-4 shadow-lg">
           <div className="max-w-6xl mx-auto flex gap-2">
             <button 
               onClick={handleSaveDraft}
               className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-3 rounded font-medium transition-colors flex items-center justify-center gap-2 text-sm"
             >
               <Save className="w-4 h-4" />
               Salvar Rascunho
             </button>
             <button 
               onClick={handlePublish}
               disabled={!isFormValid || saving || uploadingCover}
               className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-3 rounded font-medium transition-colors flex items-center justify-center gap-2 text-sm"
             >
               <Send className="w-4 h-4" />
               {post.agendamento ? 'Agendar' : 'Publicar'}
             </button>
           </div>
         </div>
       </div>
     </div>
   );
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
              <div className="flex justify-between mt-1 text-xs text-gray-500"><span>r10piaui.com.br/{(post.titulo||'').toLowerCase().replace(/[^\w\s]/g,'').replace(/\s+/g,'-')||'titulo-da-materia'}</span><span>{post.titulo.length}/80</span></div>
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
              <select value={post.posicao} onChange={e=>handleInputChange('posicao', e.target.value)} className="w-full px-3 py-2 border rounded text-sm">{[{value:'supermanchete',label:'Super Manchete'},{value:'destaque',label:'Destaque'},{value:'geral',label:'Geral'},{value:'municipios',label:'Municípios'}].map(p=> <option key={p.value} value={p.value}>{p.label}</option>)}</select>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4"><h3 className="text-sm font-medium mb-3">Resumo</h3><QuickSummary value={post.resumo} onChange={v=>handleInputChange('resumo', v)} content={post.conteudo} /></div>
          <div className="bg-white rounded-lg border p-4"><h3 className="text-sm font-medium mb-3">Imagem de Destaque</h3><div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 cursor-pointer bg-gray-50" onClick={()=>document.getElementById('image-upload')?.click()}>{post.imagemDestaque? <div className="relative"><img src={post.imagemDestaque} alt="Preview" className="w-full h-48 object-cover rounded" /><button onClick={e=>{e.stopPropagation();handleInputChange('imagemDestaque', null);}} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X className="w-4 h-4"/></button></div> : <><Camera className="w-8 h-8 text-gray-400 mx-auto mb-2"/><p className="text-sm text-gray-600">Clique para enviar</p><p className="text-xs text-gray-500">JPG/PNG/WebP até 5MB</p></>}<input id="image-upload" type="file" className="hidden" accept="image/*" onChange={async e=>{ const f=e.target.files?.[0]; if(!f)return; const reader=new FileReader(); reader.onload=ev=>handleInputChange('imagemDestaque', ev.target?.result as string); reader.readAsDataURL(f); const fd=new FormData(); fd.append('image', f); const token=localStorage.getItem('token'); try{ const resp=await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL||'/api'}/upload`,{method:'POST',headers:{'Authorization':`Bearer ${token}`},body:fd}); if(resp.ok){ const d=await resp.json(); handleInputChange('imagemDestaque', d.imageUrl);} }catch(err){ console.error('Upload falhou',err);} }} /></div></div>
          <div className="bg-white rounded-lg border p-4"><details><summary className="cursor-pointer flex items-center gap-2"><Zap className="w-4 h-4 text-purple-500"/>Recursos Avançados</summary><div className="mt-3 space-y-4"><div><h4 className="text-sm font-medium mb-2">Tags com IA</h4><AITagsGenerator title={post.titulo} content={post.conteudo} tags={post.tags} onTagsChange={tags=>handleInputChange('tags', tags)} /></div><div><h4 className="text-sm font-medium mb-2">Agendamento</h4><input type="datetime-local" value={post.agendamento||''} onChange={e=>handleInputChange('agendamento', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />{post.agendamento && <p className="mt-1 text-xs text-gray-600">📅 {new Date(post.agendamento).toLocaleString('pt-BR')}</p>}</div><div><h4 className="text-sm font-medium mb-2">Distribuição</h4><div className="grid grid-cols-2 gap-2">[{"key":'whatsappAuto',icon:MessageSquare,title:'WhatsApp',color:'bg-green-500'},{"key":'pushAuto',icon:Bell,title:'Push',color:'bg-blue-500'},{"key":'igCardAuto',icon:Instagram,title:'Instagram',color:'bg-pink-500'},{"key":'audioAuto',icon:Mic,title:'Áudio',color:'bg-purple-500'}].map(a=> <label key={a.key} className="flex items-center gap-2 p-2 border rounded cursor-pointer"><div className={`${a.color} p-1 rounded`}><a.icon className="w-3 h-3 text-white"/></div><span className="text-sm flex-1">{a.title}</span><input type="checkbox" checked={(post as any)[a.key]} onChange={e=>handleInputChange(a.key, e.target.checked)} /></label>)}</div></div></div></details></div>
        </div>
      </div>
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 -mx-4 shadow-lg"><div className="max-w-6xl mx-auto flex gap-2"><button onClick={handleSaveDraft} className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 px-3 rounded font-medium flex items-center justify-center gap-2 text-sm"><Save className="w-4 h-4"/>Salvar Rascunho</button><button onClick={handlePublish} disabled={!isFormValid||isBlocked} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-3 rounded font-medium flex items-center justify-center gap-2 text-sm"><Send className="w-4 h-4"/>{post.agendamento? 'Agendar':'Publicar'}</button></div></div>
    </div>
  </div>;
};

export default PostForm;