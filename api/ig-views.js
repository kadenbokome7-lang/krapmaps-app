export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const { codes } = req.query;
  if (!codes) return res.status(400).json({ error: 'No codes provided' });

  const codeList = codes.split(',').filter(Boolean).slice(0, 50);
  const results = {};

  await Promise.all(codeList.map(async (code) => {
    try {
      const url = `https://www.instagram.com/reel/${code}/`;
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });

      if (!r.ok) { results[code] = { views: 0, likes: 0, comments: 0, reposts: 0 }; return; }
      const html = await r.text();

      const extract = (patterns) => {
        for (const p of patterns) {
          const m = html.match(p);
          if (m) return parseInt(m[1], 10);
        }
        return 0;
      };

      results[code] = {
        views: extract([
          /"play_count":(\d+)/,
          /"view_count":(\d+)/,
          /"video_view_count":(\d+)/,
          /\"playCount\":(\d+)/,
          /"edge_media_video_view_count":{"count":(\d+)}/,
        ]),
        likes: extract([
          /"like_count":(\d+)/,
          /"edge_media_preview_like":{"count":(\d+)}/,
          /"edge_liked_by":{"count":(\d+)}/,
          /\"likeCount\":(\d+)/,
        ]),
        comments: extract([
          /"comment_count":(\d+)/,
          /"edge_media_to_parent_comment":{"count":(\d+)}/,
          /\"commentCount\":(\d+)/,
        ]),
        reposts: extract([
          /"reshare_count":(\d+)/,
          /"repost_count":(\d+)/,
          /\"reshareCount\":(\d+)/,
          /\"repostCount\":(\d+)/,
        ]),
      };
    } catch(e) {
      results[code] = { views: 0, likes: 0, comments: 0, reposts: 0 };
    }
  }));

  return res.status(200).json(results);
}
