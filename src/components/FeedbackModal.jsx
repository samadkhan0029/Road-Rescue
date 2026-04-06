import React, { useState } from 'react';
import { Star, X, Send, ThumbsUp } from 'lucide-react';

const FeedbackModal = ({ 
  isOpen, 
  onClose, 
  jobId, 
  providerId, 
  providerName,
  onSubmit 
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const preDefinedTags = [
    'Fast Arrival',
    'Professional', 
    'Fair Price',
    'Friendly',
    'Well-equipped',
    'Safe Driving'
  ];

  const handleStarClick = (starValue) => {
    setRating(starValue);
  };

  const handleStarHover = (starValue) => {
    setHoveredStar(starValue);
  };

  const handleStarLeave = () => {
    setHoveredStar(0);
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating before submitting.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const reviewData = {
        jobId,
        providerId,
        rating,
        tags: selectedTags,
        comment: comment.trim()
      };

      console.log('Submitting review with data:', reviewData);
      console.log('Review data structure:', {
        jobId: typeof jobId,
        providerId: typeof providerId,
        rating: typeof rating,
        tags: Array.isArray(selectedTags) ? selectedTags.length : 'not array',
        comment: typeof comment.trim()
      });

      await onSubmit(reviewData);
      
      // Reset form
      setRating(0);
      setSelectedTags([]);
      setComment('');
      onClose();
      
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setRating(0);
    setSelectedTags([]);
    setComment('');
    onClose();
  };

  const renderStars = () => {
    return (
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((starValue) => (
          <button
            key={starValue}
            type="button"
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => handleStarHover(starValue)}
            onMouseLeave={handleStarLeave}
            className="transition-all duration-200 transform hover:scale-110"
          >
            <Star
              size={32}
              className={`${
                starValue <= (hoveredStar || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              } transition-colors duration-200`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{ zIndex: 999999 }}>
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-auto shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ThumbsUp className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Rate Your Experience</h3>
          <p className="text-slate-600">How was your service with {providerName || 'your provider'}?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3 text-center">Your Rating</label>
            {renderStars()}
            <p className="text-center text-sm text-slate-500 mt-2">
              {rating === 0 ? 'Select a rating' : `${rating} star${rating > 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Pre-defined Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">What did you like?</label>
            <div className="flex flex-wrap gap-2">
              {preDefinedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Additional Comments (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share more about your experience..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{comment.length}/500 characters</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </form>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default FeedbackModal;
