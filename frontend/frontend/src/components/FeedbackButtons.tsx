import React, { useState } from 'react';

interface FeedbackButtonsProps {
  onFeedback: (rating: number, text: string) => void;
}

const FEEDBACK_TAGS = [
  "Be more concise",
  "Explain more",
  "Too verbose",
  "Good answer",
  "Not accurate",
  "Helpful",
  "Unhelpful"
];

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({ onFeedback }) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (selectedRating !== null) {
      onFeedback(selectedRating, selectedTags.join(", "));
      setSelectedRating(null);
      setSelectedTags([]);
    } else {
      alert('Please select a rating (1-5) before submitting.');
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3 p-3 bg-gray-50 rounded border border-gray-200">
      <p className="text-sm font-medium text-gray-700">Rate the response & provide feedback:</p>
      {/* Star Rating Buttons */}
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => setSelectedRating(rating)}
            className={`w-10 h-10 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 ${
              selectedRating === rating
                ? 'bg-primary-600 text-white border-primary-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            aria-pressed={selectedRating === rating}
            aria-label={`Rate ${rating} out of 5`}
          >
            {rating}
          </button>
        ))}
      </div>
      {/* Feedback Tag Buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {FEEDBACK_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagToggle(tag)}
            className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
              selectedTags.includes(tag)
                ? 'bg-primary-600 text-white border-primary-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            aria-pressed={selectedTags.includes(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={selectedRating === null}
        className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Feedback
      </button>
    </div>
  );
};

export default FeedbackButtons;
