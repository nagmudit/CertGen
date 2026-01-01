import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export async function generateCertificate(templateJson: any, variables: any): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  
  // Assuming a standard landscape A4 or the size from fabric
  // Fabric default is often small, but let's assume 800x600 for now as set in the editor
  const width = 800;
  const height = 600;
  const page = doc.addPage([width, height]);

  // Simple implementation: Iterate over objects and draw text
  // In a real app, you'd handle images, shapes, etc.
  if (templateJson && templateJson.objects) {
    for (const obj of templateJson.objects) {
      if (obj.type === 'i-text' || obj.type === 'text') {
        let text = obj.text;
        
        // Replace variables
        for (const [key, value] of Object.entries(variables)) {
          text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }

        const fontSize = obj.fontSize || 20;
        const x = obj.left || 0;
        const y = height - (obj.top || 0) - fontSize; // PDF coordinates are bottom-left, Fabric is top-left

        // Use standard font for simplicity
        const font = await doc.embedFont(StandardFonts.Helvetica);

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0), // Default to black, parsing obj.fill is complex
        });
      }
    }
  }

  return await doc.save();
}
