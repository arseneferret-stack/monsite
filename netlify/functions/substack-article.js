'use strict';

const DEFAULT_FEED_URL = 'https://bleedthebrain.substack.com/feed';

exports.handler = async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return htmlResponse(204, '', {});
    }

    if (event.httpMethod && event.httpMethod !== 'GET') {
        return htmlResponse(405, '<h1>Method not allowed</h1>');
    }

    const slug = getRequestedSlug(event);
    if (!slug) {
        return htmlResponse(400, '<h1>Missing article slug</h1>');
    }

    try {
        const response = await fetch(DEFAULT_FEED_URL, {
            headers: {
                Accept: 'application/rss+xml, application/xml, text/xml'
            }
        });

        if (!response.ok) {
            return htmlResponse(502, '<h1>Unable to fetch Substack feed</h1>');
        }

        const xml = await response.text();
        const article = findArticleBySlug(xml, slug, event);

        if (!article) {
            return htmlResponse(404, '<h1>Article not found</h1>');
        }

        return htmlResponse(200, renderArticlePage(article), {
            'Cache-Control': 'public, max-age=900'
        });
    } catch (_error) {
        return htmlResponse(500, '<h1>Unexpected error while generating article</h1>');
    }
};

function getRequestedSlug(event) {
    const fromQuery = (event.queryStringParameters?.slug || '').trim();
    if (fromQuery) {
        return fromQuery;
    }

    const rawPath = event.rawPath || event.path || '';
    const match = rawPath.match(/\/(?:articles\/substack|\.netlify\/functions\/substack-article)\/([^/?#]+)/i);
    if (!match || !match[1]) {
        return '';
    }

    return decodeURIComponent(match[1]).trim();
}

function findArticleBySlug(xml, slug, event) {
    const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
    const items = pairTranslations(itemMatches.map(parseItem).filter((item) => item.slug));

    for (const item of items) {
        if (item.slug !== slug) {
            continue;
        }

        return {
            title: item.title,
            link: item.link,
            publishedAt: item.publishedAt,
            description: item.description,
            body: normalizeArticleHtml(item.content || item.description),
            translationPath: toAbsoluteArticlePath(event, item.translationPath),
            translationLabel: item.language === 'fr' ? 'Read English version' : 'Lire la version française'
        };
    }

    return null;
}

function toAbsoluteArticlePath(event, path) {
    if (!path) {
        return null;
    }

    const headers = event.headers || {};
    const protocol = headers['x-forwarded-proto'] || headers['X-Forwarded-Proto'] || 'https';
    const host = headers['x-forwarded-host'] || headers['X-Forwarded-Host'] || headers.host || '';
    if (!host) {
        return path;
    }

    return `${protocol}://${host}${path}`;
}

function renderArticlePage(article) {
    const title = escapeHtml(article.title);
    const byline = article.publishedAt
        ? `Publié le ${escapeHtml(formatDate(article.publishedAt))}`
        : 'Publié sur arseneferret';
    const translationBlock = article.translationPath
        ? `<div style="text-align:center; margin:16px 0;"><a class="retro-button" href="${escapeHtml(article.translationPath)}">${escapeHtml(article.translationLabel)}</a></div>`
        : '';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - arseneferret</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body class="article-page substack-article-page">
<article>
  <h1>${title}</h1>
  <p class="byline">${byline}</p>

  <div class="article-body">
        ${translationBlock}
    ${article.body}
    <p style="margin-top:18px; font-size:13px; color:rgba(0,0,0,0.6)">Publié automatiquement depuis Substack — lire en ligne.</p>
  </div>

  <div class="article-engagement">
    <div class="engagement-header">
      <button class="like-btn" data-article-slug="${escapeHtml(article.slug || title.replace(/\\s+/g, '-').toLowerCase())}">
        <span class="like-icon">♥</span>
        <span class="like-count">0</span>
      </button>
      <span class="comment-count">
        <span class="comment-icon">💬</span>
        <span class="comment-num">0</span>
      </span>
    </div>

    <div class="comments-section">
      <h3>Laisser un commentaire</h3>
      <form class="comment-form" data-article-slug="${escapeHtml(article.slug || title.replace(/\\s+/g, '-').toLowerCase())}">
        <input type="text" name="name" placeholder="Votre nom" required>
        <textarea name="message" placeholder="Votre commentaire..." required rows="4"></textarea>
        <button type="submit" class="submit-btn">Envoyer</button>
      </form>
      <div class="comments-list"></div>
    </div>
  </div>
</article>
<script src="/script.js"></script>
</body>
</html>`;
}

function parseItem(itemXml) {
    const title = cleanText(readTag(itemXml, 'title'));
    const description = cleanText(readTag(itemXml, 'description'));
    const content = readTag(itemXml, 'content:encoded');
    const link = cleanText(readTag(itemXml, 'link'));
    const publishedAt = readTag(itemXml, 'pubDate');
    const slug = extractSlug(link);

    return {
        title,
        description,
        content,
        link,
        slug,
        publishedAt,
        language: detectLanguage(`${title} ${description} ${content}`),
        translationPath: null
    };
}

function pairTranslations(items) {
    const paired = items.map((item) => ({ ...item }));

    for (let index = 0; index < paired.length; index += 1) {
        if (paired[index].translationPath) {
            continue;
        }

        for (let offset = 1; offset <= 2; offset += 1) {
            const candidate = paired[index + offset];
            if (!candidate || candidate.translationPath) {
                continue;
            }

            if (!arePotentialTranslations(paired[index], candidate)) {
                continue;
            }

            paired[index].translationPath = `/articles/substack/${candidate.slug}`;
            candidate.translationPath = `/articles/substack/${paired[index].slug}`;
            break;
        }
    }

    return paired;
}

function arePotentialTranslations(left, right) {
    if (!left.slug || !right.slug) {
        return false;
    }

    if (left.language === 'unknown' || right.language === 'unknown' || left.language === right.language) {
        return false;
    }

    if (!left.publishedAt || !right.publishedAt) {
        return false;
    }

    const distance = Math.abs(new Date(left.publishedAt).getTime() - new Date(right.publishedAt).getTime());
    return distance <= 1000 * 60 * 90;
}

function detectLanguage(text) {
    const value = (text || '').toLowerCase();
    const frenchScore = scoreMatches(value, [
        /[àâçéèêëîïôûùüÿœ]/g,
        /\b(le|la|les|de|des|du|une|un|dans|pour|avec|est|plus|famille|vers|fabrique|démantèlement|anesthésie)\b/g
    ]);
    const englishScore = scoreMatches(value, [
        /\b(the|and|with|this|that|family|repetition|under|still|there|english|version|longer|play|disintegration)\b/g
    ]);

    if (frenchScore === englishScore) {
        return 'unknown';
    }

    return frenchScore > englishScore ? 'fr' : 'en';
}

function scoreMatches(value, patterns) {
    return patterns.reduce((total, pattern) => total + ((value.match(pattern) || []).length), 0);
}

function normalizeArticleHtml(value) {
    let html = sanitizeHtml(value || '');

    if (!html) {
        return '';
    }

    html = html.replace(/<p(?![^>]*class=)/i, '<p class="lead"');
    return html;
}

function sanitizeHtml(value) {
    return value
        .replace(/<script\b[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[\s\S]*?<\/style>/gi, '')
        .replace(/<form\b[\s\S]*?<\/form>/gi, '')
        .replace(/<button\b[\s\S]*?<\/button>/gi, '')
        .replace(/<div\b[^>]*subscription-widget-wrap-editor[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, '')
        .replace(/<div\b[^>]*class="preamble"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div\b[^>]*class="fake-input-wrapper"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/\sdata-[^=]+="[^"]*"/gi, '')
        .replace(/\sclass="[^"]*(subscription-widget|image-link-expand|icon-container|pencraft|restack-image|view-image)[^"]*"/gi, '')
        .trim();
}

function extractSlug(link) {
    if (!link) {
        return null;
    }

    try {
        const url = new URL(link);
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts[0] !== 'p' || !parts[1]) {
            return null;
        }

        return parts[1];
    } catch (_error) {
        return null;
    }
}

function readTag(xml, tagName) {
    const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cdataPattern = new RegExp(`<${escapedTag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${escapedTag}>`, 'i');
    const plainPattern = new RegExp(`<${escapedTag}[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`, 'i');
    const cdataMatch = xml.match(cdataPattern);

    if (cdataMatch) {
        return cdataMatch[1].trim();
    }

    const plainMatch = xml.match(plainPattern);
    return plainMatch ? plainMatch[1].trim() : '';
}

function cleanText(value) {
    return decodeEntities((value || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim());
}

function decodeEntities(value) {
    return value
        .replace(/&#(\d+);/g, (_match, codePoint) => String.fromCodePoint(Number(codePoint)))
        .replace(/&#x([\da-f]+);/gi, (_match, codePoint) => String.fromCodePoint(parseInt(codePoint, 16)))
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'date inconnue';
    }

    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

function escapeHtml(value) {
    return (value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function htmlResponse(statusCode, body, extraHeaders) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            ...extraHeaders
        },
        body
    };
}