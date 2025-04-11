import gymnasium as gym
import numpy as np

class HomeLoanAgentEnv(gym.Env):
    """
    Custom RL environment for the Home Loan Assistant agent.
    State: Encoded user message (for demo, use integer index or embedding).
    Action: Discrete set of response templates or tool choices.
    Reward: User feedback rating (1-5, normalized).
    """
    def __init__(self, episodes):
        super().__init__()
        self.episodes = episodes  # List of (state, action, reward) tuples
        self.current_idx = 0

        # For demo: state is an integer index, action is discrete
        self.observation_space = gym.spaces.Discrete(1000)  # e.g., 1000 possible user message types
        self.action_space = gym.spaces.Discrete(10)         # e.g., 10 possible response types

    def reset(self, seed=None, options=None):
        self.current_idx = 0
        if len(self.episodes) == 0:
            return 0, {}
        state, _, _ = self.episodes[self.current_idx]
        return state, {}

    def step(self, action):
        # Get reward for this (state, action) pair
        if self.current_idx >= len(self.episodes):
            return 0, 0.0, True, False, {}

        state, true_action, reward = self.episodes[self.current_idx]
        done = self.current_idx == len(self.episodes) - 1

        # Reward is only given if action matches the true action (for demo)
        # In practice, you may want to use reward directly from feedback
        reward = float(reward) / 5.0  # Normalize to [0, 1]

        self.current_idx += 1
        next_state = self.episodes[self.current_idx][0] if self.current_idx < len(self.episodes) else 0

        return next_state, reward, done, False, {}

    def render(self):
        pass
