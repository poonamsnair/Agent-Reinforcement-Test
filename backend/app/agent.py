import os
from typing import Tuple, Dict, Any
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_react_agent, Tool
from langchain import hub
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import PromptTemplate
from stable_baselines3 import PPO # Import PPO
import torch # Import torch if needed by PPO
import numpy as np # Import numpy
import json # Import json if needed for thinking process formatting

# --- Tool Functions ---

def _calculate_mortgage(input_str: str) -> str:
    """Calculate monthly mortgage payment."""
    try:
        params = _parse_parameters(input_str)
        principal = float(params.get("principal", 0))
        rate = float(params.get("rate", 0)) / 100 / 12  # Convert annual rate to monthly
        term = int(params.get("term", 0)) * 12  # Convert years to months
        
        if principal <= 0 or rate < 0 or term <= 0:
            return "Invalid input: principal, rate, and term must be positive."
            
        if rate == 0:
            monthly_payment = principal / term
        else:
            monthly_payment = principal * (rate * (1 + rate) ** term) / ((1 + rate) ** term - 1)
        
        return f"Monthly payment: ${monthly_payment:.2f}"
    except Exception as e:
        return f"Error calculating mortgage: {str(e)}"

def _check_eligibility(input_str: str) -> str:
    """Check loan eligibility based on provided parameters."""
    try:
        params = _parse_parameters(input_str)
        income = float(params.get("income", 0))
        credit_score = int(params.get("credit_score", 0))
        dti = float(params.get("dti", 0))
        
        if income <= 0 or credit_score <= 0 or dti < 0:
             return "Invalid input: income, credit_score, and dti must be positive."

        eligibility = "likely eligible" if (credit_score >= 640 and dti <= 43) else "may face challenges"
        
        return f"Based on the provided information (income: ${income}, credit score: {credit_score}, DTI: {dti}%), you are {eligibility} for a conventional home loan."
    except Exception as e:
        return f"Error checking eligibility: {str(e)}"

def _get_interest_info(query: str) -> str:
    """Provide information about interest rates."""
    # This would typically fetch real data, but we'll use static info for the example
    return """Current average 30-year fixed mortgage rate: 6.5%
Current average 15-year fixed mortgage rate: 5.8%
Factors affecting rates:
- Federal Reserve policies
- Inflation rates
- Economic growth
- Housing market conditions
- Your credit score and financial situation"""

def _parse_parameters(input_str: str) -> Dict[str, Any]:
    """Parse parameters from input string (e.g., 'principal=300000, rate=6.5, term=30')."""
    params = {}
    try:
        parts = input_str.split(",")
        for part in parts:
            if "=" in part:
                key, value = part.split("=", 1)
                params[key.strip()] = value.strip()
    except Exception:
        pass
    return params

# --- LangChain Agent Setup ---

class HomeLoanLangChainAgent:
    """Home loan assistant agent using LangChain ReAct, with PPO suggestion."""
    
    def __init__(self, ppo_model_path="ppo_agent.zip"):
        self.api_key = os.environ.get("OPENROUTER_API_KEY")
        
        # Load the trained PPO model if it exists
        self.ppo_model = None
        if os.path.exists(ppo_model_path):
            try:
                self.ppo_model = PPO.load(ppo_model_path)
                print(f"Successfully loaded PPO model from {ppo_model_path}")
            except Exception as e:
                print(f"Warning: Could not load PPO model from {ppo_model_path}: {e}")
        else:
             print(f"Warning: PPO model file not found at {ppo_model_path}")

        # Configure LLM (OpenRouter via OpenAI compatibility)
        self.llm = ChatOpenAI(
            model="anthropic/claude-3-opus", 
            openai_api_key=self.api_key,
            openai_api_base="https://openrouter.ai/api/v1", # Add OpenRouter base URL
            temperature=0.7,
            http_client=None, # Explicitly set http_client to avoid proxy issues
        )
        
        # Define tools
        self.tools = [
            Tool(
                name="mortgage_calculator",
                func=_calculate_mortgage,
                description="Useful for calculating monthly mortgage payments. Input should be a string like 'principal=300000, rate=6.5, term=30'."
            ),
            Tool(
                name="loan_eligibility_checker",
                func=_check_eligibility,
                description="Useful for checking loan eligibility. Input should be a string like 'income=75000, credit_score=720, dti=35'."
            ),
            Tool(
                name="interest_rate_info",
                func=_get_interest_info,
                description="Useful for getting current general interest rate information. Input is ignored, just provide an empty string."
            )
        ]
        
        # Get the ReAct prompt
        prompt = hub.pull("hwchase17/react-chat")
        
        # Create the ReAct agent
        agent = create_react_agent(self.llm, self.tools, prompt)
        
        # Set up memory
        self.memory = ConversationBufferMemory(memory_key="chat_history")
        
        # Create the AgentExecutor
        self.agent_executor = AgentExecutor(
            agent=agent, 
            tools=self.tools, 
            memory=self.memory, 
            verbose=True, # Set to True for debugging agent steps
            handle_parsing_errors=True # Handle cases where LLM output is not parsable
        )

    def get_response(self, user_input: str) -> Tuple[str, str]:
        """
        Get a response from the LangChain agent, including PPO suggestion if available.
        
        Args:
            user_input: The user's message
            
        Returns:
            Tuple containing (agent_response, agent_thinking)
        """
        try:
            # Handle direct tool calls first
            if user_input.strip().startswith("/tool"):
                parts = user_input.strip().split(" ", 2)
                if len(parts) >= 2:
                    tool_name = parts[1]
                    params = parts[2] if len(parts) > 2 else ""
                    thinking = f"Invoking tool directly: {tool_name} with params: {params}\n"
                    if tool_name == "mortgage_calculator":
                        response = _calculate_mortgage(params)
                    elif tool_name == "loan_eligibility" or tool_name == "loan_eligibility_checker": # Accept both names
                        response = _check_eligibility(params)
                    elif tool_name == "interest_rate_info":
                        response = _get_interest_info(params)
                    else:
                        response = f"Unknown tool: {tool_name}"
                    # Add to memory manually if needed, or let the main flow handle it
                    # self.memory.save_context({"input": user_input}, {"output": response}) 
                    return response, thinking
                else:
                    return "Invalid tool command format. Use: /tool tool_name params", "Invalid command"

            # --- PPO Suggestion (Demonstration) ---
            ppo_suggestion_text = "PPO Model not loaded."
            if self.ppo_model:
                try:
                    # Use the same simple state hashing as the old agent/training for demo
                    state_int = abs(hash(user_input)) % 1000 
                    # Convert state to NumPy array with explicit dtype
                    state_np = np.array([state_int], dtype=np.int64) 
                    # Pass the NumPy array to predict
                    action_index, _ = self.ppo_model.predict(state_np, deterministic=True)
                    # Map index to a descriptive action (based on OldHomeLoanAgent logic)
                    action_map = { 
                        0: "Suggest: Use mortgage_calculator", 
                        1: "Suggest: Use loan_eligibility_checker", 
                        2: "Suggest: Use interest_rate_info",
                        # Indices 3-9 mapped to general LLM call
                    }
                    # Use action_index[0] as predict returns an array
                    ppo_suggestion_text = action_map.get(action_index[0], f"Suggest: General LLM response (Action {action_index[0]})") 
                except Exception as ppo_e:
                    ppo_suggestion_text = f"PPO Error: {ppo_e}"
            # --- End PPO Suggestion ---

            # Invoke the main LangChain agent executor
            result = self.agent_executor.invoke({"input": user_input})
            
            response = result.get("output", "Sorry, I encountered an issue.")
            
            # Combine PPO suggestion with LangChain agent thinking
            thinking = f"PPO Model: {ppo_suggestion_text}\n---\nLangChain Agent:\n"
            
            # Manually format intermediate steps for robustness
            intermediate_steps_str = ""
            steps = result.get('intermediate_steps', [])
            if steps:
                for i, step in enumerate(steps):
                    action, observation = step # Unpack the tuple
                    intermediate_steps_str += f"Step {i+1}:\n"
                    intermediate_steps_str += f"  Action: {action.tool}\n"
                    intermediate_steps_str += f"  Action Input: {action.tool_input}\n"
                    # Convert observation to string safely
                    observation_str = str(observation) 
                    intermediate_steps_str += f"  Observation: {observation_str}\n"
                thinking += intermediate_steps_str
            else:
                 thinking += "(No intermediate steps taken)\n"

            return response, thinking
            
        except Exception as e:
            import traceback
            print(f"Error invoking LangChain agent: {e}")
            print(traceback.format_exc())
            return f"I encountered an error processing your request: {str(e)}", "Error occurred"

# Note: The OldHomeLoanAgent and SimpleLLM classes are no longer used by routes.py
# They could be removed, but are kept here for reference.
class SimpleLLM:
    """Simple LLM implementation for demonstration purposes."""
    
    def __init__(self, api_key=None, model_name=None, temperature=0.7):
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY")
        self.model_name = model_name or "anthropic/claude-3-opus"
        self.temperature = temperature
        
    def invoke(self, prompt):
        """Call the OpenRouter API for completions."""
        try:
            import requests
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": self.model_name,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": self.temperature
            }
            response = requests.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            result = response.json()
            # Extract the assistant's reply
            return result["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error calling OpenRouter API: {str(e)}"

class OldHomeLoanAgent:
    """Home loan assistant agent using a simplified LLM implementation."""
    
    def __init__(self):
        self.api_key = os.environ.get("OPENROUTER_API_KEY")
        self.llm = SimpleLLM(api_key=self.api_key)

        # PPO RL policy
        self.ppo_model = None
        self.ppo_actions = [
            "Sure, I can help you with that.",
            "Let's calculate your mortgage payment.",
            "You may be eligible for a home loan.",
            "Current interest rates are around 6.5%.",
            "Please provide more details about your income.",
            "I recommend checking your credit score.",
            "Would you like to use the mortgage calculator tool?",
            "You can improve eligibility by reducing your DTI.",
            "Ask me about loan types or the buying process.",
            "Let me connect you to a loan officer."
        ]
        try:
            from stable_baselines3 import PPO
            import torch
            if os.path.exists("ppo_agent.zip"):
                self.ppo_model = PPO.load("ppo_agent.zip")
        except Exception as e:
            self.ppo_model = None

        # Define tools for the agent
        self.tools = [
            Tool(
                name="mortgage_calculator",
                func=_calculate_mortgage,
                description="Calculate monthly mortgage payment given principal, interest rate, and term"
            ),
            Tool(
                name="loan_eligibility",
                func=_check_eligibility,
                description="Check loan eligibility based on income, credit score, and debt-to-income ratio"
            ),
            Tool(
                name="interest_rate_info",
                func=_get_interest_info,
                description="Get information about current interest rates and factors affecting them"
            )
        ]
        
        # Set up memory
        self.memory = []
    
    def get_response(self, user_input: str) -> Tuple[str, str]:
        """
        Get a response from the agent. If the message starts with /tool, call the tool directly.
        Otherwise, use the OpenRouter LLM for the response.
        """
        try:
            self.memory.append({"role": "user", "content": user_input})
            thinking = ""
            if user_input.strip().startswith("/tool"):
                parts = user_input.strip().split(" ", 2)
                if len(parts) >= 2:
                    tool_name = parts[1]
                    params = parts[2] if len(parts) > 2 else ""
                    thinking = f"Invoking tool: {tool_name} with params: {params}\n"
                    if tool_name == "mortgage_calculator":
                        response = _calculate_mortgage(params)
                    elif tool_name == "loan_eligibility":
                        response = _check_eligibility(params)
                    elif tool_name == "interest_rate_info":
                        response = _get_interest_info(params)
                    else:
                        response = f"Unknown tool: {tool_name}"
                else:
                    response = "Invalid tool command format. Use: /tool tool_name params"
            else:
                # If PPO model is loaded, use it to select an action
                if self.ppo_model is not None:
                    thinking = "Using PPO RL policy for response selection.\n"
                    # For demo: state = hash of user_input % 1000
                    state = abs(hash(user_input)) % 1000
                    action, _ = self.ppo_model.predict(state, deterministic=True)
                    
                    # Map action to tool or LLM call
                    if action == 0:
                        thinking += "PPO chose mortgage_calculator tool.\n"
                        # For demo, use default params
                        response = _calculate_mortgage("principal=300000, rate=6.5, term=30")
                    elif action == 1:
                        thinking += "PPO chose loan_eligibility tool.\n"
                        # For demo, use default params
                        response = _check_eligibility("income=75000, credit_score=720, dti=35")
                    elif action == 2:
                        thinking += "PPO chose interest_rate_info tool.\n"
                        response = _get_interest_info("")
                    else: # Actions 3-9: Call LLM
                        thinking += "PPO chose to call LLM.\n"
                        response = self.llm.invoke(user_input)
                else:
                    thinking = "No PPO model loaded. Sending user input to OpenRouter LLM API.\n"
                    response = self.llm.invoke(user_input)
            self.memory.append({"role": "assistant", "content": response})
            return response, thinking
        except Exception as e:
            return f"I encountered an error: {str(e)}", "Error occurred during processing"
