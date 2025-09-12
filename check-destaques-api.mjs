try {
    const response = await fetch('http://127.0.0.1:3002/api/posts?limit=20');
    const data = await response.json();
    
    const destaques = data.posts.filter(p => p.section === 'destaque');
    
    console.log('=== MATÉRIAS NA SEÇÃO DESTAQUE ===');
    console.log('Total encontradas:', destaques.length);
    console.log('');
    
    destaques.forEach((post, index) => {
        console.log(`${index + 1}. ID: ${post.id} | Pos: ${post.position} | Título: ${post.title.substring(0, 50)}...`);
    });
    
    if (destaques.length < 5) {
        console.log('\n⚠️  PROBLEMA: Menos de 5 matérias na seção destaque!');
        
        // Vou mostrar também todas as matérias para entender o que está acontecendo
        console.log('\n=== TODAS AS MATÉRIAS ===');
        data.posts.forEach((post, index) => {
            console.log(`${index + 1}. ID: ${post.id} | Section: ${post.section} | Pos: ${post.position} | ${post.title.substring(0, 40)}...`);
        });
    } else {
        console.log('\n✅ OK: 5 matérias encontradas na seção destaque');
    }
} catch (error) {
    console.error('Erro ao verificar destaques:', error.message);
}