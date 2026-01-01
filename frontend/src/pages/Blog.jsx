import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Eye, ArrowRight, Search, BookOpen } from 'lucide-react';
import SEO from '../components/SEO';
import './Blog.css';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [activeCategory, currentPage]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 9,
        ...(activeCategory !== 'all' && { category: activeCategory })
      });

      const res = await fetch(`/api/blog/posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Fetch posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/blog/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredPosts = searchQuery
    ? posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  const featuredPost = filteredPosts[0];
  const gridPosts = filteredPosts.slice(1);

  return (
    <>
      <SEO
        title="Blog"
        description="Explore jewelry tips, style guides, and the latest trends. Learn about jewelry care, bridal collections, and behind-the-scenes stories from Aabhar."
        keywords="jewelry blog, jewelry care tips, style guide, bridal jewelry, fashion trends, Aabhar"
      />

      <div className="blog-page">
        <div className="container">
          {/* Header */}
          <div className="blog-header">
            <div className="blog-header-content">
              <h1>
                <BookOpen size={36} />
                Our Blog
              </h1>
              <p>Discover jewelry tips, styling guides, and the latest trends</p>
            </div>

            <div className="blog-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="category-tabs">
            <button
              className={`category-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => { setActiveCategory('all'); setCurrentPage(1); }}
            >
              All Posts
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-tab ${activeCategory === cat.name ? 'active' : ''}`}
                onClick={() => { setActiveCategory(cat.name); setCurrentPage(1); }}
              >
                {cat.name}
                {cat.post_count > 0 && <span className="tab-count">{cat.post_count}</span>}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="blog-loading">
              <div className="featured-skeleton skeleton"></div>
              <div className="blog-grid">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="blog-card-skeleton">
                    <div className="skeleton" style={{ aspectRatio: '16/9' }}></div>
                    <div className="skeleton" style={{ height: 24, marginTop: 16, width: '80%' }}></div>
                    <div className="skeleton" style={{ height: 16, marginTop: 8, width: '100%' }}></div>
                    <div className="skeleton" style={{ height: 16, marginTop: 4, width: '60%' }}></div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="no-posts">
              <BookOpen size={48} />
              <h3>No articles found</h3>
              <p>
                {searchQuery
                  ? `No articles matching "${searchQuery}"`
                  : 'Check back soon for new content!'}
              </p>
              {searchQuery && (
                <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featuredPost && (
                <Link to={`/blog/${featuredPost.slug}`} className="featured-post">
                  <div className="featured-image">
                    <img src={featuredPost.cover_image} alt={featuredPost.title} />
                    <span className="featured-badge">Featured</span>
                  </div>
                  <div className="featured-content">
                    <span className="post-category">{featuredPost.category}</span>
                    <h2>{featuredPost.title}</h2>
                    <p>{featuredPost.excerpt}</p>
                    <div className="post-meta">
                      <span><Calendar size={14} /> {formatDate(featuredPost.published_at)}</span>
                      <span><Clock size={14} /> {featuredPost.read_time} min read</span>
                      <span><Eye size={14} /> {featuredPost.view_count} views</span>
                    </div>
                    <span className="read-more">
                      Read Article <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              )}

              {/* Blog Grid */}
              {gridPosts.length > 0 && (
                <div className="blog-grid">
                  {gridPosts.map(post => (
                    <Link to={`/blog/${post.slug}`} key={post.id} className="blog-card">
                      <div className="blog-card-image">
                        <img src={post.cover_image} alt={post.title} />
                      </div>
                      <div className="blog-card-content">
                        <span className="post-category">{post.category}</span>
                        <h3>{post.title}</h3>
                        <p>{post.excerpt}</p>
                        <div className="post-meta">
                          <span><Calendar size={12} /> {formatDate(post.published_at)}</span>
                          <span><Clock size={12} /> {post.read_time} min</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="blog-pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Blog;
