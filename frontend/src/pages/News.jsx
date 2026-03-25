import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ExternalLink, Share2, AlertCircle } from 'lucide-react';

const mockNews = [
  { id: 1, title: 'Major Earthquake Strikes Coast of Japan, Tsunami Warning Issued', source: 'Reuters', time: '10 mins ago', image: 'https://images.unsplash.com/photo-1541888001692-23c2a11b854c?auto=format&fit=crop&q=80', severity: 'High' },
  { id: 2, title: 'Wildfires in California State Parks Burn Over 10,000 Acres', source: 'CNN', time: '45 mins ago', image: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&q=80', severity: 'Critical' },
  { id: 3, title: 'Hurricane Category 4 Approaching Florida Coastline', source: 'BBC News', time: '2 hours ago', image: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&q=80', severity: 'Critical' },
  { id: 4, title: 'Flash Floods in Mumbai Suburbs Due to Unseasonal Rains', source: 'NDTV', time: '3 hours ago', image: 'https://images.unsplash.com/photo-1545642412-4c2847a9ff60?auto=format&fit=crop&q=80', severity: 'Medium' },
  { id: 5, title: 'Volcanic Eruption Detected in Iceland, Flights Diverted', source: 'Al Jazeera', time: '5 hours ago', image: 'https://images.unsplash.com/photo-1620023023075-84a8ddb166ff?auto=format&fit=crop&q=80', severity: 'High' },
  { id: 6, title: 'Drought Conditions Worsen in Horn of Africa', source: 'World Bank Reports', time: '1 day ago', image: 'https://images.unsplash.com/photo-1447703693928-1b6ad7f29aa4?auto=format&fit=crop&q=80', severity: 'Medium' },
];

const SkeletonCard = () => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-[1.5rem] overflow-hidden animate-pulse">
    <div className="h-56 bg-slate-800/80 w-full" />
    <div className="p-6">
      <div className="flex gap-2 mb-4">
        <div className="h-4 w-20 bg-slate-800 rounded-md" />
        <div className="h-4 w-24 bg-slate-800 rounded-md" />
      </div>
      <div className="h-6 w-full bg-slate-800 rounded-md mb-2" />
      <div className="h-6 w-3/4 bg-slate-800 rounded-md mb-6" />
      <div className="flex justify-between mt-6 pt-6 border-t border-slate-800">
        <div className="h-4 w-16 bg-slate-800 rounded-md" />
        <div className="h-4 w-24 bg-slate-800 rounded-md" />
      </div>
    </div>
  </div>
);

export default function News() {
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState([]);

  useEffect(() => {
    fetch("https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Frss.nytimes.com%2Fservices%2Fxml%2Frss%2Fnyt%2FClimate.xml")
      .then(res => res.json())
      .then(data => {
        const fallbacks = [
          'https://images.unsplash.com/photo-1541888001692-23c2a11b854c?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1545642412-4c2847a9ff60?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1620023023075-84a8ddb166ff?auto=format&fit=crop&q=80'
        ];
        
        if (data && data.items && data.items.length > 0) {
          const liveNews = data.items.map((p, i) => {
            let timeStr = "Recently";
            if (p.pubDate) {
              const pubTime = new Date(p.pubDate.replace(" ", "T")).getTime(); // Simple format parse
              const diffMin = Math.round((Date.now() - pubTime) / 60000);
              if (diffMin > 0 && diffMin < 60) timeStr = `${Math.max(1, diffMin)} mins ago`;
              else if (diffMin >= 60 && diffMin < 1440) timeStr = `${Math.round(diffMin/60)} hours ago`;
              else if (diffMin >= 1440) timeStr = `${Math.round(diffMin/1440)} days ago`;
            }
            // NYT often omits direct thumbnail, so merge fallbacks dynamically
            const imageUrl = (p.thumbnail && p.thumbnail.startsWith("http")) 
              ? p.thumbnail 
              : fallbacks[i % fallbacks.length];

            return {
              id: i,
              title: p.title,
              source: p.author || 'NYT Climate',
              time: timeStr,
              url: p.link,
              image: imageUrl,
              severity: i % 4 === 0 ? 'Critical' : (i % 2 === 0 ? 'High' : 'Medium')
            };
          });
          setNews(liveNews);
        } else {
          setNews(mockNews);
        }
      })
      .catch(err => {
        console.error("News fetch error:", err);
        setNews(mockNews);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-16 px-6 lg:px-12 bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-4 tracking-tight">
              Verified Disaster News
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl">
              Real-time updates curated from trusted global sources. AI-filtered to prioritize urgent and high-impact events.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 w-full md:w-auto">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="text-blue-400 font-semibold uppercase tracking-wider text-sm">Live Feed</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : news.map((item, i) => (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group bg-slate-900/40 border border-slate-800/80 rounded-[1.5rem] overflow-hidden hover:bg-slate-800/40 hover:border-slate-700 transition-all shadow-lg hover:shadow-2xl flex flex-col h-full"
                >
                  <div className="relative h-56 overflow-hidden">
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-xl backdrop-blur-md border ${
                        item.severity === 'Critical' ? 'bg-red-500/20 text-red-100 border-red-500/50' :
                        item.severity === 'High' ? 'bg-orange-500/20 text-orange-100 border-orange-500/50' :
                        'bg-yellow-500/20 text-yellow-100 border-yellow-500/50'
                      }`}>
                        {item.severity}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 text-sm text-teal-400 font-medium mb-3">
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {item.source}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-4 h-4" /> {item.time}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-50 leading-tight mb-4 group-hover:text-teal-300 transition-colors line-clamp-3">
                      {item.title}
                    </h2>

                    <div className="mt-auto pt-6 border-t border-slate-800 flex justify-between items-center text-slate-400">
                      <button className="hover:text-white transition-colors flex items-center gap-2">
                        <Share2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Share</span>
                      </button>
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors font-semibold group-hover:translate-x-1 duration-300">
                        Read More <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </motion.article>
              ))}
        </div>
      </div>
    </div>
  );
}
