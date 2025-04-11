import os
import pickle
from stable_baselines3 import PPO
from stable_baselines3.common.env_util import make_vec_env
from app.rl_env import HomeLoanAgentEnv
from app.reinforcement import ReinforcementLoop

def train_ppo_agent(reinforcement_loop: ReinforcementLoop, model_path="ppo_agent.zip"):
    try:
        print("Exporting episodes for RL training...")
        episodes = reinforcement_loop.export_episodes_for_rl()
        print(f"Number of episodes: {len(episodes)}")
        if not episodes:
            print("No episodes available for training.")
            return None

        # Extract only (state, action, reward) for the current simplified environment
        # The text_feedback is available in `episodes` for future enhancements
        training_data = [(s, a, r) for s, a, r, txt in episodes]
        
        print("Creating RL environment...")
        env = HomeLoanAgentEnv(training_data) # Pass only (s, a, r)
        vec_env = make_vec_env(lambda: env, n_envs=1)

        print("Initializing PPO agent...")
        model = PPO("MlpPolicy", vec_env, verbose=1)
        print("Starting PPO training...")
        # Increase timesteps for more meaningful training
        model.learn(total_timesteps=10000) 
        print("Training complete. Saving model...")
        model.save(model_path)
        print(f"Trained PPO agent saved to {model_path}")
        
        # Save training timestamp
        version_file = model_path.replace(".zip", "_version.txt")
        try:
            import time
            with open(version_file, "w") as f:
                f.write(str(time.time()))
            print(f"Agent version timestamp saved to {version_file}")
        except Exception as ts_e:
            print(f"Warning: Could not save agent version timestamp: {ts_e}")
            
        return model_path
    except Exception as e:
        import traceback
        print("Error during PPO training:", str(e))
        print(traceback.format_exc())
        return None

if __name__ == "__main__":
    # For demo: load or create a ReinforcementLoop and train
    rl = ReinforcementLoop()
    # Optionally, load interactions/feedback from disk here
    train_ppo_agent(rl)
