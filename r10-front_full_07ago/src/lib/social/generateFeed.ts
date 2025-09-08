export async function generateFeedBuffer({ title, hat, imageUrl, overlayUrl }: {
  title: string;
  hat: string;
  imageUrl: string;
  overlayUrl: string;
}): Promise<Buffer> {
  // Mock para testes - retorna um PNG válido simples
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // "IHDR"
    0x00, 0x00, 0x04, 0x38, // width: 1080
    0x00, 0x00, 0x05, 0x46, // height: 1350
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x00, 0x00, 0x00, 0x00, // CRC placeholder
  ]);
  
  // Adiciona dados mock para simular uma imagem real
  const mockData = Buffer.alloc(10000, 0x00);
  
  return Buffer.concat([pngHeader, mockData]);
} 