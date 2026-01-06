import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, Eye, ArrowLeft, User } from 'lucide-react';
import { apiFetch } from '../config/api';
import SEO from '../components/SEO';
import ShareButtons from '../components/product/ShareButtons';
import './BlogPost.css';

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchedSlugRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Prevent double fetch in React StrictMode
    if (fetchedSlugRef.current !== slug) {
      fetchedSlugRef.current = slug;
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/blog/posts/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
        fetchRelatedPosts(data.id);
      }
    } catch (error) {
      console.error('Fetch post error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async (postId) => {
    try {
      const res = await apiFetch(`/api/blog/posts/${postId}/related?limit=3`);
      if (res.ok) {
        const data = await res.json();
        setRelatedPosts(data);
      }
    } catch (error) {
      console.error('Fetch related posts error:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="blog-post-page loading">
        <div className="container">
          <div className="skeleton" style={{ height: 40, width: '60%', marginBottom: 16 }}></div>
          <div className="skeleton" style={{ height: 20, width: '30%', marginBottom: 32 }}></div>
          <div className="skeleton" style={{ height: 400, marginBottom: 32, borderRadius: 16 }}></div>
          <div className="skeleton" style={{ height: 20, marginBottom: 12 }}></div>
          <div className="skeleton" style={{ height: 20, marginBottom: 12 }}></div>
          <div className="skeleton" style={{ height: 20, width: '80%' }}></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="blog-post-page not-found">
        <div className="container">
          <h1>Article Not Found</h1>
          <p>The article you're looking for doesn't exist or has been removed.</p>
          <Link to="/blog" className="btn btn-primary">
            <ArrowLeft size={18} /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const parseTags = () => {
    if (!post.tags) return [];
    try {
      return typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags;
    } catch {
      return [];
    }
  };

  return (
    <>
      <SEO
        title={post.title}
        description={post.excerpt || post.title}
        image={post.cover_image}
        type="article"
        keywords={parseTags().join(', ')}
      />

      <div className="blog-post-page">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/blog">Blog</Link>
            <span>/</span>
            <span>{post.category}</span>
          </nav>

          <article className="blog-article">
            {/* Header */}
            <header className="article-header">
              <span className="post-category">{post.category}</span>
              <h1>{post.title}</h1>
              
              <div className="article-meta">
                <div className="author">
                  {post.author_image ? (
                    <img src={post.author_image} alt={post.author_name} />
                  ) : (
                    <div className="author-placeholder">
                      <User size={20} />
                    </div>
                  )}
                  <span>{post.author_name || 'Aabhar Team'}</span>
                </div>
                <span className="divider">•</span>
                <span><Calendar size={14} /> {formatDate(post.published_at)}</span>
                <span className="divider">•</span>
                <span><Clock size={14} /> {post.read_time} min read</span>
                <span className="divider">•</span>
                <span><Eye size={14} /> {post.view_count} views</span>
              </div>

              <div className="share-wrapper">
                <ShareButtons product={{ name: post.title }} positionBelow />
              </div>
            </header>

            {/* Cover Image */}
            {post.cover_image && (
              <div className="cover-image">
                <img src={post.cover_image} alt={post.title} />
              </div>
            )}

            {/* Content */}
            <div 
              className="article-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {parseTags().length > 0 && (
              <div className="article-tags">
                <span>Tags:</span>
                {parseTags().map((tag, index) => (
                  <span key={index} className="tag">#{tag}</span>
                ))}
              </div>
            )}
          </article>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="related-posts">
              <h2>Related Articles</h2>
              <div className="related-grid">
                {relatedPosts.map(related => (
                  <Link to={`/blog/${related.slug}`} key={related.id} className="related-card">
                    <div className="related-image">
                      <img src={related.cover_image} alt={related.title} />
                    </div>
                    <div className="related-content">
                      <span className="post-category">{related.category}</span>
                      <h3>{related.title}</h3>
                      <div className="post-meta">
                        <span><Clock size={12} /> {related.read_time} min read</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Back to Blog */}
          <div className="back-to-blog">
            <Link to="/blog" className="btn btn-secondary">
              <ArrowLeft size={18} /> Back to Blog
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPost;
