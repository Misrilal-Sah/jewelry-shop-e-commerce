import { useState, useEffect } from 'react';
import { MessageCircle, ChevronDown, ChevronUp, Send, User, CheckCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { useModal } from '../ui/Modal';
import './ProductQA.css';

const ProductQA = ({ productId }) => {
  const { isAuthenticated, token, user } = useAuth();
  const toast = useToast();
  const modal = useModal();
  
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [answeringId, setAnsweringId] = useState(null);

  useEffect(() => {
    if (productId) {
      fetchQuestions();
    }
  }, [productId]);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/questions`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error('Fetch questions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    
    if (!isAuthenticated) {
      toast.info('Please login to ask a question');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ question: newQuestion.trim() })
      });
      
      if (res.ok) {
        toast.success('Question submitted successfully!');
        setNewQuestion('');
        setShowAskForm(false);
        fetchQuestions();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to submit question');
      }
    } catch (error) {
      toast.error('Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (questionId) => {
    if (!answerText.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/questions/${questionId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answer: answerText.trim() })
      });
      
      if (res.ok) {
        toast.success('Answer submitted!');
        setAnswerText('');
        setAnsweringId(null);
        fetchQuestions();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to submit answer');
      }
    } catch (error) {
      toast.error('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Admin delete handlers
  const handleDeleteQuestion = async (questionId) => {
    modal.confirm(
      'Delete Question',
      'Are you sure you want to delete this question and all its answers? This action cannot be undone.',
      async () => {
        try {
          const res = await fetch(`/api/admin/questions/${questionId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            toast.success('Question deleted successfully');
            fetchQuestions();
          } else {
            toast.error('Failed to delete question');
          }
        } catch (error) {
          toast.error('Failed to delete question');
        }
      }
    );
  };

  const handleDeleteAnswer = async (answerId) => {
    modal.confirm(
      'Delete Answer',
      'Are you sure you want to delete this answer? This action cannot be undone.',
      async () => {
        try {
          const res = await fetch(`/api/admin/answers/${answerId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            toast.success('Answer deleted successfully');
            fetchQuestions();
          } else {
            toast.error('Failed to delete answer');
          }
        } catch (error) {
          toast.error('Failed to delete answer');
        }
      }
    );
  };

  if (loading) {
    return <div className="product-qa-loading">Loading Q&A...</div>;
  }

  return (
    <div className="product-qa">
      <div className="qa-header">
        <h3><MessageCircle size={20} /> Questions & Answers</h3>
        <button 
          className="btn btn-outline ask-btn"
          onClick={() => setShowAskForm(!showAskForm)}
        >
          Ask a Question
        </button>
      </div>

      {/* Ask Question Form */}
      {showAskForm && (
        <form className="ask-form" onSubmit={handleAskQuestion}>
          <textarea
            placeholder="What would you like to know about this product?"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <div className="ask-form-actions">
            <button 
              type="button" 
              className="btn btn-ghost"
              onClick={() => setShowAskForm(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!newQuestion.trim() || submitting}
            >
              <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Question'}
            </button>
          </div>
          {!isAuthenticated && (
            <p className="login-hint">Please <a href="/login">login</a> to submit your question.</p>
          )}
        </form>
      )}

      {/* Questions List */}
      <div className="questions-list">
        {questions.length === 0 ? (
          <div className="no-questions">
            <MessageCircle size={32} />
            <p>No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          questions.map(q => (
            <div key={q.id} className="question-item">
              <div 
                className="question-header"
                onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
              >
                <div className="question-content">
                  <span className="question-label">Q:</span>
                  <span className="question-text">{q.question}</span>
                </div>
                <div className="question-meta">
                  <span className="answer-count">
                    {q.answers?.length || 0} answer{q.answers?.length !== 1 ? 's' : ''}
                  </span>
                  {expandedQuestion === q.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
              
              <div className="question-info">
                <User size={14} /> {q.user_name} • {formatDate(q.created_at)}
                {user?.role === 'admin' && (
                  <button 
                    className="qa-delete-btn"
                    onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id); }}
                    title="Delete Question"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {expandedQuestion === q.id && (
                <div className="answers-section">
                  {q.answers && q.answers.length > 0 ? (
                    q.answers.map(a => (
                      <div key={a.id} className={`answer-item ${a.is_official ? 'official' : ''}`}>
                        <div className="answer-content">
                          <span className="answer-label">A:</span>
                          <span className="answer-text">{a.answer}</span>
                        </div>
                        <div className="answer-meta">
                          {a.is_official && (
                            <span className="official-badge">
                              <CheckCircle size={14} /> Official Answer
                            </span>
                          )}
                          <span>{a.user_name || 'Store'} • {formatDate(a.created_at)}</span>
                          {user?.role === 'admin' && (
                            <button 
                              className="qa-delete-btn"
                              onClick={() => handleDeleteAnswer(a.id)}
                              title="Delete Answer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-answers">No answers yet</p>
                  )}
                  
                  {/* Answer form for authenticated users */}
                  {isAuthenticated && (
                    <div className="answer-form-container">
                      {answeringId === q.id ? (
                        <div className="answer-form">
                          <textarea
                            placeholder="Write your answer..."
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            rows={2}
                          />
                          <div className="answer-form-actions">
                            <button 
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => { setAnsweringId(null); setAnswerText(''); }}
                            >
                              Cancel
                            </button>
                            <button 
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={!answerText.trim() || submitting}
                              onClick={() => handleAnswer(q.id)}
                            >
                              Submit Answer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          className="btn btn-link"
                          onClick={() => setAnsweringId(q.id)}
                        >
                          Answer this question
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductQA;
