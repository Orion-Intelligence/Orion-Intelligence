import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'markdown', standalone: true, pure: true })
export class MarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return this.renderBlocks(value ?? '');
  }

  private renderBlocks(value: string): string {
    const lines = value.replace(/\r\n?/g, '\n').split('\n');
    const html: string[] = [];
    const paragraph: string[] = [];
    let listType: 'ol' | 'ul' | null = null;
    let listItems: string[] = [];
    let codeLines: string[] | null = null;

    const flushParagraph = () => {
      if (!paragraph.length) {
        return;
      }
      html.push(`<p>${this.renderInline(paragraph.join('\n')).replace(/\n/g, '<br>')}</p>`);
      paragraph.length = 0;
    };

    const flushList = () => {
      if (!listType || !listItems.length) {
        return;
      }
      html.push(`<${listType}>${listItems.map(item => `<li>${item}</li>`).join('')}</${listType}>`);
      listType = null;
      listItems = [];
    };

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? '';
      const trimmed = line.trim();

      if (codeLines) {
        if (trimmed.startsWith('```')) {
          html.push(`<pre><code>${this.escapeHtml(codeLines.join('\n'))}</code></pre>`);
          codeLines = null;
        }
        else {
          codeLines.push(line);
        }
        continue;
      }

      if (trimmed.startsWith('```')) {
        flushParagraph();
        flushList();
        codeLines = [];
        continue;
      }

      if (!trimmed) {
        flushParagraph();
        flushList();
        continue;
      }

      const table = this.tryRenderTable(lines, index);
      if (table) {
        flushParagraph();
        flushList();
        html.push(table.html);
        index = table.endIndex;
        continue;
      }

      const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        const level = heading[1].length;
        html.push(`<h${level}>${this.renderInline(heading[2])}</h${level}>`);
        continue;
      }

      if (/^([-*_])(?:\s*\1){2,}$/.test(trimmed)) {
        flushParagraph();
        flushList();
        html.push('<hr>');
        continue;
      }

      const quote = trimmed.match(/^>\s?(.*)$/);
      if (quote) {
        flushParagraph();
        flushList();
        const quoteLines = [quote[1]];
        while (index + 1 < lines.length) {
          const nextQuote = (lines[index + 1] ?? '').trim().match(/^>\s?(.*)$/);
          if (!nextQuote) {
            break;
          }
          quoteLines.push(nextQuote[1]);
          index += 1;
        }
        html.push(`<blockquote><p>${this.renderInline(quoteLines.join('\n')).replace(/\n/g, '<br>')}</p></blockquote>`);
        continue;
      }

      const unordered = trimmed.match(/^[-*+]\s+(.+)$/);
      const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
      if (unordered || ordered) {
        flushParagraph();
        const nextType = ordered ? 'ol' : 'ul';
        if (listType && listType !== nextType) {
          flushList();
        }
        listType = nextType;
        listItems.push(this.renderInline((ordered ?? unordered)?.[1] ?? ''));
        continue;
      }

      flushList();
      paragraph.push(line);
    }

    if (codeLines) {
      html.push(`<pre><code>${this.escapeHtml(codeLines.join('\n'))}</code></pre>`);
    }
    flushParagraph();
    flushList();

    return html.join('');
  }

  private tryRenderTable(lines: string[], startIndex: number): { html: string; endIndex: number } | null {
    const header = lines[startIndex]?.trim() ?? '';
    const separator = lines[startIndex + 1]?.trim() ?? '';
    if (!header.includes('|') || !/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(separator)) {
      return null;
    }

    const headers = this.parseTableCells(header);
    const rows: string[][] = [];
    let endIndex = startIndex + 1;

    while (endIndex + 1 < lines.length) {
      const row = lines[endIndex + 1]?.trim() ?? '';
      if (!row.includes('|') || !row) {
        break;
      }
      rows.push(this.parseTableCells(row));
      endIndex += 1;
    }

    const thead = `<thead><tr>${headers.map(cell => `<th>${this.renderInline(cell)}</th>`).join('')}</tr></thead>`;
    const tbody = rows.length
      ? `<tbody>${rows.map(row => `<tr>${headers.map((_, cellIndex) => `<td>${this.renderInline(row[cellIndex] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody>`
      : '';

    return { html: `<table>${thead}${tbody}</table>`, endIndex };
  }

  private parseTableCells(line: string): string[] {
    return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
  }

  private renderInline(value: string): string {
    const tokens: string[] = [];
    const token = (html: string) => {
      const key = `\uE000${tokens.length}\uE001`;
      tokens.push(html);
      return key;
    };

    let text = value
      .replace(/`([^`]+)`/g, (_match, code: string) => token(`<code>${this.escapeHtml(code)}</code>`))
      .replace(/\[([^\]]+)]\(([^)\s]+)\)/g, (_match, label: string, href: string) => {
        const url = this.escapeAttribute(this.sanitizeHref(href));
        return token(`<a href="${url}" target="_blank" rel="noopener noreferrer">${this.renderInline(label)}</a>`);
      });

    text = this.escapeHtml(text)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>');

    tokens.forEach((html, index) => {
      text = text.replaceAll(`\uE000${index}\uE001`, html);
    });

    return text;
  }

  private sanitizeHref(value: string): string {
    const trimmed = value.trim();
    return /^(https?:|mailto:|\/|#)/i.test(trimmed) ? trimmed : '#';
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeAttribute(value: string): string {
    return this.escapeHtml(value);
  }
}
