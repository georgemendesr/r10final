import React, { Suspense, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { buildSiteMeta, buildCategoryMeta } from './lib/seo';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import TopAdStrip from './components/TopAdStrip';
import Header from './components/Header';
import SEOHeader from './components/SEOHeader';
import BreakingBar from './components/BreakingBar';
import HeroHeadline from './components/HeroHeadline';
import HeroGrid from './components/HeroGrid';
import HeroGridVertical from './components/HeroGridVertical';
import HeroGridMosaico from './components/HeroGridMosaico';
import HeroGridPremium from './components/HeroGridPremium';
import NewsGeneralSection from './components/NewsGeneralSection';
import MostReadSection from './components/MostReadSection';
import DailyEmotionsSection from './components/DailyEmotionsSection';
import R10PlaySection from './components/R10PlaySection';
import MunicipiosSection from './components/MunicipiosSection';
import Footer from './components/Footer';
import AdminLink from './components/AdminLink';
import { AuthProvider } from './contexts/AuthContext';
import { getLayoutConfig, getActiveHeroLayout } from './services/layoutService';
import { initializeServices } from './services/initService';
// Import dinâmico para contornar problema de resolução de export default
const ArticlePage = React.lazy(() => import('./components/ArticlePage')
  .then(mod => ({ default: (mod as any).default || (mod as any).ArticlePage }))
  .catch(err => {
    console.error('[App] Falha ao carregar ArticlePage:', err);
    return { default: () => <div className="p-8 text-center text-red-600">Erro ao carregar matéria.</div> };
  })
);

// Lazy loading para componentes pesados (admin/dashboard)
const R10PlayPage = React.lazy(() => import('./components/R10PlayPage'));
const LoginPage = React.lazy(() => import('./components/LoginPage'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const PostForm = React.lazy(() => import('./components/PostForm'));
const TestePosts = React.lazy(() => import('./components/TestePosts'));
const SimplePostsTest = React.lazy(() => import('./components/SimplePostsTest'));

// Lazy loading para páginas de teste de layout
const TestLayoutVertical = React.lazy(() => import('./pages/TestLayoutVertical'));
const TestLayoutMosaico = React.lazy(() => import('./pages/TestLayoutMosaico'));
const TestLayoutPremium = React.lazy(() => import('./pages/TestLayoutPremium'));

// ... (resto dos imports)

function App() {
  const HomePage = () => {
    const [layoutConfig, setLayoutConfig] = useState(() => getLayoutConfig());
    const [updateKey, setUpdateKey] = useState(0);

    // Inicializar serviços na startup
    useEffect(() => {
      initializeServices();
      
      // Inicializar observador para animações de destaque
      const initializeHighlightAnimations = () => {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target as HTMLElement;
              if (element.getAttribute('data-highlight') === 'animated') {
                element.classList.add('animate-in-view');
                element.style.backgroundSize = '100% 100%';
                observer.unobserve(element);
              }
            }
          });
        }, { threshold: 0.1 });

        // Observar elementos existentes
        const observeElements = () => {
          const animatedElements = document.querySelectorAll('[data-highlight="animated"]');
          animatedElements.forEach(element => {
            if (!element.classList.contains('animate-in-view')) {
              observer.observe(element);
            }
          });
        };

        // Observer inicial
        observeElements();

        // Reobservar quando conteúdo mudar (para artigos carregados dinamicamente)
        const mutationObserver = new MutationObserver(() => {
          setTimeout(observeElements, 100);
        });

        mutationObserver.observe(document.body, {
          childList: true,
          subtree: true
        });

        return () => {
          observer.disconnect();
          mutationObserver.disconnect();
        };
      };

      const cleanup = initializeHighlightAnimations();
      return cleanup;
    }, []);

    // Força atualização quando volta para a homepage
    useEffect(() => {
      const handleFocus = () => {
        const newConfig = getLayoutConfig();
        setLayoutConfig(newConfig);
        setUpdateKey(prev => prev + 1);
      };
      
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }, []);

    // Função para obter o componente HeroGrid correto baseado no layout ativo
    const getActiveHeroGridComponent = () => {
      const activeLayout = getActiveHeroLayout();
      switch (activeLayout) {
        case 'vertical':
          return <div data-e2e="hero-grid"><HeroGridVertical /></div>;
        case 'mosaico':
          return <div data-e2e="hero-grid"><HeroGridMosaico /></div>;
        case 'premium':
          return <div data-e2e="hero-grid"><HeroGridPremium /></div>;
        default:
          return <div data-e2e="hero-grid"><HeroGrid /></div>;
      }
    };

    const sectionComponents: { [key: string]: React.ReactNode } = {
      superManchete: <div data-e2e="hero-headline"><HeroHeadline /></div>,
      destaques: getActiveHeroGridComponent(),
      noticiasGerais: <NewsGeneralSection />,
      maisLidas: <MostReadSection />,
      reacoes: <DailyEmotionsSection />,
      r10Play: <div data-e2e="r10-play"><R10PlaySection /></div>,
      municipios: <MunicipiosSection />,
    };

    return (
      <>
        {import.meta.env.DEV && (
          <Helmet>
            {(() => {
              const s = buildSiteMeta();
              return (
                <>
                  <title>{s.title}</title>
                  <meta name="description" content={s.description} />
                  <meta property="og:title" content={s.title} />
                  <meta property="og:description" content={s.description} />
                  <meta property="og:url" content={s.url} />
                  <meta property="og:image" content={s.image} />
                  <meta name="twitter:card" content="summary_large_image" />
                </>
              );
            })()}
          </Helmet>
        )}
        <TopAdStrip />
        <Header />
        <SEOHeader page="home" isVisible={false} />
        <main id="conteudo">
          <BreakingBar />
          {layoutConfig.filter(section => section.enabled).map((section, index) => (
            <div key={`${section.id}-${updateKey}-${index}`}>
              {sectionComponents[section.id]}
            </div>
          ))}
        </main>
        <Footer />
        <AdminLink />
      </>
    );
  };

  const CategoryPage = () => {
    const { category } = useParams<{ category: string }>();
    const categoryMeta = buildCategoryMeta(category || 'geral');
    
    return (
      <>
        <Helmet>
          <title>{categoryMeta.title}</title>
          <meta name="description" content={categoryMeta.description} />
          <meta property="og:title" content={categoryMeta.title} />
          <meta property="og:description" content={categoryMeta.description} />
          <meta property="og:url" content={categoryMeta.url} />
          <meta property="og:image" content={categoryMeta.image} />
          <meta name="twitter:title" content={categoryMeta.title} />
          <meta name="twitter:description" content={categoryMeta.description} />
        </Helmet>
        <TopAdStrip />
        <Header />
        <SEOHeader page="category" category={category} />
        <main id="conteudo" className="bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 py-8 max-w-[1250px]">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <p className="text-gray-600 text-lg">
                Conteúdo da categoria {category} será carregado aqui.
              </p>
            </div>
          </div>
        </main>
        <Footer />
        <AdminLink />
      </>
    );
  };

  const MunicipiosPage = () => (
    <>
      <TopAdStrip />
      <Header />
      <main id="conteudo" className="bg-gray-50 min-h-screen">
        <MunicipiosSection />
      </main>
      <Footer />
      <AdminLink />
    </>
  );

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          
          {/* Rota para artigos individuais */}
          <Route 
            path="/noticia/:categoria/:slug/:id" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>}>
                <ArticlePage />
              </Suspense>
            } 
          />
          <Route 
            path="/noticia/:slug" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>}>
                <ArticlePage />
              </Suspense>
            } 
          />
          
          {/* Rotas de teste para layouts alternativos */}
          <Route 
            path="/test-vertical" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div></div>}>
                <TestLayoutVertical />
              </Suspense>
            } 
          />
          <Route 
            path="/test-mosaico" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div></div>}>
                <TestLayoutMosaico />
              </Suspense>
            } 
          />
          <Route 
            path="/test-premium" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div></div>}>
                <TestLayoutPremium />
              </Suspense>
            } 
          />
          
          <Route 
            path="/noticia/:subcategoria/:titulo/:id" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>}>
                <ArticlePage />
              </Suspense>
            } 
          />
          <Route 
            path="/noticia/:id" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>}>
                <ArticlePage />
              </Suspense>
            } 
          />
          <Route 
            path="/post/:id" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>}>
                <ArticlePage />
              </Suspense>
            } 
          />
          <Route 
            path="/r10-play" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>}>
                <R10PlayPage />
              </Suspense>
            } 
          />
          <Route 
            path="/login" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>}>
                <LoginPage />
              </Suspense>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>}>
                <Dashboard />
              </Suspense>
            } 
          />
          <Route 
            path="/teste" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>}>
                <TestePosts />
              </Suspense>
            } 
          />
          <Route 
            path="/debug-posts" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>}>
                <SimplePostsTest />
              </Suspense>
            } 
          />
          <Route 
            path="/admin/materias" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>}>
                <Dashboard />
              </Suspense>
            } 
          />
          <Route 
            path="/admin/usuarios" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>}>
                <Dashboard />
              </Suspense>
            } 
          />
          <Route 
            path="/admin/configuracoes" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>}>
                <Dashboard />
              </Suspense>
            } 
          />
          <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
          <Route 
            path="/admin/nova-materia" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>}>
                <PostForm />
              </Suspense>
            } 
          />
          <Route 
            path="/admin/editar-materia/:id" 
            element={
              <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div></div>}>
                <PostForm />
              </Suspense>
            } 
          />
          <Route path="/categoria/:category" element={<CategoryPage />} />
          <Route path="/municipios" element={<MunicipiosPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;