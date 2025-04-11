import uuid
import time
import json
import numpy as np
import networkx as nx
from typing import Dict, List, Any, Optional
import os # Import os module

class ReinforcementLoop:
    """
    Implements a reinforcement learning loop for the home loan assistant agent.
    Tracks interactions, collects feedback, and updates the agent's behavior.
    """
    
    def __init__(self):
        # Store interactions with unique IDs
        self.interactions = {}
        
        # Track feedback for each interaction
        self.feedback = {}
        
        # Store the learning graph for visualization
        self.learning_graph = nx.DiGraph()
        
        # Track performance metrics over time
        self.performance_metrics = {
            'ratings': [],          # List of all ratings
            'timestamps': [],       # List of timestamps for each rating
            'average_ratings': [],  # List of running average ratings
            'accuracy': [],         # List of running accuracy (ratings >= 4)
            'rating_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}, # Counts for each rating
            'recent_average_rating': [], # List of average rating over last 10 evals
            'topics': {}            # Topic-specific metrics
        }
        # Define the path relative to the project root (assuming run.py is there)
        self.version_file_path = "backend/ppo_agent_version.txt" 
    
    def record_interaction(self, user_input: str, agent_response: str) -> str:
        """
        Record an interaction between the user and agent.
        
        Args:
            user_input: The user's message
            agent_response: The agent's response
            
        Returns:
            interaction_id: Unique ID for this interaction
        """
        interaction_id = str(uuid.uuid4())
        timestamp = time.time()
        
        # Store the interaction
        self.interactions[interaction_id] = {
            'user_input': user_input,
            'agent_response': agent_response,
            'timestamp': timestamp,
            'topics': self._extract_topics(user_input)
        }
        
        # Add node to learning graph
        self.learning_graph.add_node(
            interaction_id, 
            type='interaction',
            user_input=user_input,
            agent_response=agent_response,
            timestamp=timestamp
        )
        
        return interaction_id
    
    def record_feedback(self, interaction_id: str, rating: int, text_feedback: str = "") -> None: # Add text_feedback parameter
        """
        Record feedback for a specific interaction.
        
        Args:
            interaction_id: The ID of the interaction
            rating: Numerical rating (1-5)
            text_feedback: Optional text comment
        """
        if interaction_id not in self.interactions:
            print(f"Warning: Interaction ID {interaction_id} not found for feedback.")
            return
        
        # Store the feedback (including text)
        self.feedback[interaction_id] = {
            'rating': rating,
            'text': text_feedback, # Store text feedback
            'timestamp': time.time()
        }
        
        # Update the interaction with feedback
        self.interactions[interaction_id]['feedback'] = rating
        self.interactions[interaction_id]['text_feedback'] = text_feedback # Store text feedback in interaction
        
        # Update performance metrics
        self._update_performance_metrics(interaction_id, rating)
        
        # Update learning graph
        self._update_learning_graph(interaction_id, rating)
    
    def get_visualization_data(self) -> Dict[str, Any]:
        """
        Get data for visualizing the reinforcement learning process.
        
        Returns:
            Dictionary containing visualization data
        """
        return {
            'graph': self._get_graph_data(),
            'performance': self._get_performance_data(),
            'topics': self._get_topic_performance(),
            'agent_version': self._get_agent_version() # Add agent version
        }

    def _get_agent_version(self) -> Optional[float]:
        """Read the agent version timestamp from the file."""
        # Path relative to the script's execution directory (backend/)
        version_file_path = "ppo_agent_version.txt" 
        print(f"Attempting to read agent version from: {os.path.abspath(version_file_path)}") # Debug print
        try:
            if os.path.exists(version_file_path):
                print(f"Version file found at: {version_file_path}") # Debug print
                with open(version_file_path, "r") as f:
                    timestamp_str = f.read().strip()
                    print(f"Read timestamp string: '{timestamp_str}'") # Debug print
                    timestamp = float(timestamp_str)
                    print(f"Parsed timestamp: {timestamp}") # Debug print
                    return timestamp
            else:
                print(f"Version file NOT found at: {version_file_path}") # Debug print
                return None # Return None if file doesn't exist
        except Exception as e:
            print(f"Warning: Could not read or parse agent version file {version_file_path}: {e}")
            return None # Return None on error
    
    def _extract_topics(self, text: str) -> List[str]:
        """Extract topics from text using simple keyword matching."""
        topics = []
        
        # Simple keyword-based topic extraction
        topic_keywords = {
            'mortgage_calculation': ['calculate', 'payment', 'monthly', 'mortgage', 'principal', 'interest'],
            'loan_eligibility': ['eligible', 'eligibility', 'qualify', 'qualification', 'income', 'credit'],
            'interest_rates': ['rate', 'interest', 'apr', 'percentage', 'fixed', 'variable'],
            'loan_types': ['conventional', 'fha', 'va', 'usda', 'jumbo', 'fixed', 'arm'],
            'home_buying_process': ['process', 'buying', 'purchase', 'offer', 'closing', 'escrow']
        }
        
        text_lower = text.lower()
        for topic, keywords in topic_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                topics.append(topic)
        
        return topics or ['general']
    
    def _update_performance_metrics(self, interaction_id: str, rating: int) -> None:
        """Update performance metrics with new feedback."""
        timestamp = time.time()
        
        # Add rating to history
        self.performance_metrics['ratings'].append(rating)
        self.performance_metrics['timestamps'].append(timestamp)
        
        # Calculate running average
        all_ratings = self.performance_metrics['ratings']
        avg_rating = np.mean(all_ratings) if all_ratings else 0
        self.performance_metrics['average_ratings'].append(avg_rating)

        # Calculate accuracy (percentage of ratings >= 4)
        good_ratings = sum(1 for r in all_ratings if r >= 4)
        accuracy = (good_ratings / len(all_ratings)) * 100 if all_ratings else 0
        self.performance_metrics['accuracy'].append(accuracy)

        # Update rating distribution
        if 1 <= rating <= 5:
            self.performance_metrics['rating_distribution'][rating] += 1

        # Calculate recent average rating (last 10)
        recent_ratings = all_ratings[-10:]
        recent_avg = np.mean(recent_ratings) if recent_ratings else 0
        self.performance_metrics['recent_average_rating'].append(recent_avg)
        
        # Update topic-specific metrics
        topics = self.interactions[interaction_id].get('topics', ['general'])
        for topic in topics:
            if topic not in self.performance_metrics['topics']:
                self.performance_metrics['topics'][topic] = {
                    'ratings': [],
                    'timestamps': [],
                    'average_ratings': []
                }
            
            topic_metrics = self.performance_metrics['topics'][topic]
            topic_metrics['ratings'].append(rating)
            topic_metrics['timestamps'].append(timestamp)
            topic_metrics['average_ratings'].append(
                np.mean(topic_metrics['ratings']) if topic_metrics['ratings'] else 0
            )
    
    def _update_learning_graph(self, interaction_id: str, rating: int) -> None:
        """Update the learning graph with feedback information."""
        # Add feedback node
        feedback_id = f"feedback_{interaction_id}"
        # Retrieve the text feedback stored for this interaction
        text_feedback = self.interactions[interaction_id].get('text_feedback', '') # Retrieve stored text feedback
        self.learning_graph.add_node(
            feedback_id,
            type='feedback',
            rating=rating,
            text=text_feedback, # Use the retrieved text feedback
            timestamp=time.time()
        )
        
        # Connect feedback to interaction
        self.learning_graph.add_edge(interaction_id, feedback_id)
        
        # Add connections between similar interactions
        self._connect_similar_interactions(interaction_id)
    
    def _connect_similar_interactions(self, new_interaction_id: str) -> None:
        """Connect similar interactions in the learning graph."""
        new_interaction = self.interactions[new_interaction_id]
        new_topics = set(new_interaction.get('topics', []))
        
        for interaction_id, interaction in self.interactions.items():
            if interaction_id == new_interaction_id:
                continue
            
            # Connect interactions with similar topics
            interaction_topics = set(interaction.get('topics', []))
            if new_topics.intersection(interaction_topics):
                # Create edges in both directions
                self.learning_graph.add_edge(
                    new_interaction_id, 
                    interaction_id, 
                    type='similar_topic',
                    weight=len(new_topics.intersection(interaction_topics))
                )
    
    def _get_graph_data(self) -> Dict[str, Any]:
        """Convert the learning graph to a format suitable for visualization."""
        nodes = []
        for node_id in self.learning_graph.nodes():
            node_data = self.learning_graph.nodes[node_id]
            nodes.append({
                'id': node_id,
                'type': node_data.get('type', 'unknown'),
                'data': {k: v for k, v in node_data.items() if k != 'type'}
            })
        
        edges = []
        for source, target, data in self.learning_graph.edges(data=True):
            edges.append({
                'source': source,
                'target': target,
                'type': data.get('type', 'default'),
                'weight': data.get('weight', 1)
            })
        
        return {
            'nodes': nodes,
            'edges': edges
        }
    
    def _get_performance_data(self) -> Dict[str, Any]:
        """Get performance metrics for visualization."""
        # Return the relevant parts of the performance_metrics dict
        return {
            'timestamps': self.performance_metrics['timestamps'],
            'ratings': self.performance_metrics['ratings'],
            'average_ratings': self.performance_metrics['average_ratings'],
            'accuracy': self.performance_metrics['accuracy'],
            'rating_distribution': self.performance_metrics['rating_distribution'],
            'recent_average_rating': self.performance_metrics['recent_average_rating']
        }
    
    def _get_topic_performance(self) -> Dict[str, Dict]:
        """Get topic-specific performance metrics."""
        return self.performance_metrics['topics']

    def export_episodes_for_rl(self):
        """
        Export episodes as (state, action, reward, text_feedback) tuples for RL training.
        For demo: state = hash of user_input, action = hash of agent_response, reward = feedback rating.
        If the feedback text contains actionable cues, adjust the reward.
        """
        episodes = []
        for interaction_id, interaction in self.interactions.items():
            user_input = interaction.get('user_input', '')
            agent_response = interaction.get('agent_response', '')
            reward = interaction.get('feedback', None)
            text_feedback = interaction.get('text_feedback', '') # Get text feedback

            # Reward shaping based on feedback text
            adjusted_reward = reward
            if isinstance(text_feedback, str):
                text_lower = text_feedback.lower()
                if "concise" in text_lower:
                    adjusted_reward = max(1, reward - 1) if reward is not None else None
                elif "explain" in text_lower or "more detail" in text_lower:
                    adjusted_reward = max(1, reward - 1) if reward is not None else None
                # You can add more rules here

            if reward is not None:
                # For demo: use hash as state/action (in practice, use embeddings or indices)
                state = abs(hash(user_input)) % 1000
                action = abs(hash(agent_response)) % 10
                episodes.append((state, action, adjusted_reward, text_feedback)) # Include text feedback
        return episodes
