import React from "react";

const Docs: React.FC = () => (
  <div className="p-6 space-y-4">
    <h2 className="text-2xl font-bold mb-4">Home Loan Assistant Documentation</h2>
    
    <section>
      <h3 className="text-xl font-semibold mb-2">Overview</h3>
      <p>
        The Home Loan Assistant is designed to help users explore home loan scenarios. 
        It can answer questions about mortgages, calculate potential payments, check basic loan eligibility, 
        and provide general information about interest rates and the home buying process.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-semibold mb-2">How to Use</h3>
      <ul className="list-disc ml-6 space-y-1">
        <li>
          <strong>Chat:</strong> Interact with the assistant using natural language in the main chat panel. Ask questions like "What's the payment on a $500k loan?" or "Am I eligible with a 700 credit score?".
        </li>
        <li>
          <strong>Direct Tool Commands:</strong> You can bypass the agent's reasoning and directly invoke tools using the <code>/tool</code> command followed by the tool name and parameters:
          <ul className="list-circle ml-6 mt-1 text-sm text-gray-700">
            <li><code>/tool mortgage_calculator principal=..., rate=..., term=...</code></li>
            <li><code>/tool loan_eligibility income=..., credit_score=..., dti=...</code></li>
            <li><code>/tool interest_rate_info</code> (no parameters needed)</li>
          </ul>
        </li>
         <li>
          <strong>Feedback:</strong> After the assistant responds, use the rating buttons (1-5 stars) and optional feedback tags (e.g., "Be more concise", "Helpful") to rate the response. This feedback is crucial for improving the agent.
        </li>
      </ul>
    </section>

    <section>
      <h3 className="text-xl font-semibold mb-2">Reinforcement Learning (PPO)</h3>
      <p>
        This application uses a reinforcement learning approach, specifically Proximal Policy Optimization (PPO), 
        to potentially improve the agent's behavior over time based on user feedback.
      </p>
      <ul className="list-disc ml-6 space-y-1 mt-2">
        <li>
          <strong>Feedback Loop:</strong> Your ratings and feedback tags are collected. The rating directly influences a reward signal, and tags like "Be more concise" can further adjust this reward.
        </li>
        <li>
          <strong>Training:</strong> Clicking the "Train Agent (PPO)" button in the Visualization panel triggers a training process. The collected interactions (user input, agent response, reward) are used to update a simple PPO policy model (`ppo_agent.zip`).
        </li>
         <li>
          <strong>PPO Model's Role (Current):</strong> Currently, the trained PPO model provides a *suggestion* for the next action (like which tool to use or whether to give a general response). This suggestion is shown in the "Show thinking process" details but doesn't override the main LangChain agent's decision-making. This allows observing the PPO model's learning without disrupting the core agent flow yet.
        </li>
        <li>
          <strong>Visualization Panel:</strong> This panel shows metrics related to the feedback received (performance over time, rating distribution) and a graph visualizing the interactions and feedback. The "Agent Version" indicates the timestamp of the last successful PPO training run.
        </li>
      </ul>
       <p className="mt-2 text-sm text-gray-600">
         Note: The current PPO integration is simplified for demonstration. A more advanced implementation would involve more sophisticated state/action representations and tighter integration between the PPO policy and the LangChain agent's reasoning process.
       </p>
    </section>
    
  </div>
);

export default Docs;
