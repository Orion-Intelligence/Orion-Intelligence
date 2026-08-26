import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({ name: 'markdown', standalone: true, pure: false })
export class MarkdownPipe implements PipeTransform {
  private readonly translationService = inject(TranslationService);
  private cachedResult = '';
  private cachedValue: string | null = null;
  private cachedVersion = -1;

  transform(value: string | null | undefined): string {
    const normalizedValue = value ?? '';
    const version = this.translationService.version();
    if (normalizedValue === this.cachedValue && version === this.cachedVersion) {
      return this.cachedResult;
    }
    this.cachedValue = normalizedValue;
    this.cachedVersion = version;
    this.cachedResult = this.renderBlocks(normalizedValue);
    return this.cachedResult;
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
      ? `<tbody>${rows.map(row => `<tr>${headers.map((header, cellIndex) => `<td data-label="${this.escapeAttribute(header)}">${this.renderInline(row[cellIndex] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody>`
      : '';

    const tableShellClasses = 'w-full max-w-full mt-3 mb-1 overflow-x-auto rounded-xl border border-[var(--ui-table-shell-border)] bg-[var(--color-blue-830)] shadow-[inset_0_1px_0_rgb(255_255_255/3%)] [scrollbar-color:color-mix(in_srgb,var(--color-blue-640)_55%,transparent)_transparent] [scrollbar-width:thin] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-blue-640)]';
    const wideTableClasses = headers.length > 3
      ? ' [&&]:overflow-visible [&&]:border-0 [&&]:bg-transparent [&&]:shadow-none [&&_table]:block [&&_tbody]:block [&&_table]:w-full [&&_tbody]:w-full [&&_table]:min-w-0 [&&_tbody]:min-w-0 [&_thead]:absolute [&_thead]:-m-px [&_thead]:h-px [&_thead]:w-px [&_thead]:overflow-hidden [&_thead]:whitespace-nowrap [&_thead]:border-0 [&_thead]:p-0 [&_thead]:[clip-path:inset(50%)] [&_tr]:grid [&_tr]:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] [&_tr]:overflow-hidden [&_tr]:rounded-xl [&_tr]:border [&_tr]:border-[var(--ui-table-shell-border)] [&_tr]:bg-[var(--ui-table-row-odd)] [&_tr]:shadow-[0_8px_22px_color-mix(in_srgb,var(--color-shadow-medium)_70%,transparent)] [&_tr+tr]:mt-2.5 [&&_td]:grid [&&_td]:grid-cols-[minmax(96px,0.42fr)_minmax(0,1fr)] [&&_td]:gap-2.5 [&&_td]:min-w-0 [&&_td]:max-w-none [&&_td]:border-r-0 [&&_td]:border-t-0 [&&_td]:border-b [&&_td]:border-b-[var(--ui-table-row-border)] [&&_td]:bg-transparent [&&_td]:px-[11px] [&&_td]:py-[9px] [&_td]:before:content-[attr(data-label)] [&_td]:before:text-[10px] [&_td]:before:font-bold [&_td]:before:uppercase [&_td]:before:leading-[1.5] [&_td]:before:tracking-[0.05em] [&_td]:before:text-[var(--color-text5)] [&_td]:before:[overflow-wrap:anywhere] [&_td:first-child]:bg-[color-mix(in_srgb,var(--color-blue-640)_7%,transparent)] max-[480px]:[&_tr]:grid-cols-1 max-[480px]:[&&_td]:grid-cols-[minmax(88px,0.38fr)_minmax(0,1fr)]'
      : '';

    const tableLabel = this.escapeAttribute(this.translationService.translate('Result table'));
    return { html: `<div class="${tableShellClasses}${wideTableClasses}" role="region" aria-label="${tableLabel}" tabindex="0"><table>${thead}${tbody}</table></div>`, endIndex };
  }

  private parseTableCells(line: string): string[] {
    let content = line.startsWith('|') ? line.slice(1) : line;
    if (content.endsWith('|') && !content.endsWith('\\|')) {
      content = content.slice(0, -1);
    }
    const cells: string[] = [];
    let cell = '';
    let escaped = false;
    for (const character of content) {
      if (escaped) {
        cell += character === '|' ? '|' : `\\${character}`;
        escaped = false;
      }
      else if (character === '\\') {
        escaped = true;
      }
      else if (character === '|') {
        cells.push(cell.trim());
        cell = '';
      }
      else {
        cell += character;
      }
    }
    cells.push(`${cell}${escaped ? '\\' : ''}`.trim());
    return cells;
  }

  private renderInline(value: string): string {
    const tokens: string[] = [];
    const token = (html: string) => {
      const key = `\uE000${tokens.length}\uE001`;
      tokens.push(html);
      return key;
    };

    let text = value
      .replace(/\\([\\`*_\[\]<>|])/g, (_match, literal: string) => token(this.escapeHtml(literal)))
      .replace(/`([^`]+)`/g, (_match, code: string) => token(`<code>${this.escapeHtml(code)}</code>`))
      .replace(/\[([^\]]+)]\(([^)\s]+)\)/g, (_match, label: string, href: string) => {
        const url = this.escapeAttribute(this.sanitizeHref(href));
        return token(`<a href="${url}" target="_blank" rel="noopener noreferrer">${this.renderInline(label)}</a>`);
      });

    text = this.escapeHtml(text)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<!\w)__([^_\n]+)__(?!\w)/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '<em>$1</em>')
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
