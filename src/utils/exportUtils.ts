export const htmlToMarkdown = (html: string): string => {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    
    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();
    
    let childrenText = '';
    el.childNodes.forEach(child => {
      childrenText += processNode(child);
    });
    
    switch (tagName) {
      case 'h1': return `# ${childrenText}\n\n`;
      case 'h2': return `## ${childrenText}\n\n`;
      case 'h3': return `### ${childrenText}\n\n`;
      case 'p': return `${childrenText}\n\n`;
      case 'strong':
      case 'b': return `**${childrenText}**`;
      case 'em':
      case 'i': return `*${childrenText}*`;
      case 'u': return childrenText;
      case 's':
      case 'strike': return `~~${childrenText}~~`;
      case 'a': return `[${childrenText}](${el.getAttribute('href') || ''})`;
      case 'ul': return `${childrenText}\n`;
      case 'ol': return `${childrenText}\n`;
      case 'li': {
        const parent = el.parentElement;
        const isOrdered = parent && parent.tagName.toLowerCase() === 'ol';
        if (isOrdered) {
          const index = Array.from(parent.children).indexOf(el) + 1;
          return `${index}. ${childrenText}\n`;
        }
        return `- ${childrenText}\n`;
      }
      case 'br': return `\n`;
      case 'blockquote': return `> ${childrenText}\n\n`;
      default: return childrenText;
    }
  };
  
  return processNode(doc.body).replace(/\n{3,}/g, '\n\n').trim();
};

export const downloadMarkdown = (title: string, markdownContent: string) => {
  const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  const safeTitle = (title || 'Untitled_Reflection').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `${dateStr}_${safeTitle}.md`;
  
  document.body.appendChild(a);
  a.click();
  
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
